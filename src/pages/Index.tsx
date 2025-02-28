import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, CloudRain, Factory } from "lucide-react";
import AQIDisplay from "@/components/AQIDisplay";
import SensorCard from "@/components/SensorCard";
import { Meteors } from "@/components/Meteors";
import AQIChart from "@/components/AQIChart";

const Index = () => {
  const [data, setData] = useState({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    pm25: 0,
    pm10: 0,
    co: 0,
    methane: 0,
    airQuality: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/weather');
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const result = await response.json();
        
        setData({
          aqi: result.aqi || 0,
          temperature: result.temperature ? Number(result.temperature.toFixed(1)) : 0,
          humidity: result.humidity || 0,
          pm25: result.pm25 ? Number(result.pm25.toFixed(1)) : 0,
          pm10: result.pm10 ? Number(result.pm10.toFixed(1)) : 0,
          co: result.co ? Number(result.co.toFixed(1)) : 0,
          methane: result.methane || 0,
          airQuality: result.airQuality || 0
        });
        
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full py-8 px-4 md:py-12 md:px-8 relative">
      <Meteors />
      <main className="max-w-7xl mx-auto space-y-12">
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold typewriter colorful-border mb-4">
              Air Quality Index
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white/80 animate-pulse">
            Loading real-time data...
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            ⚠️ {error} - Please check backend connection
          </div>
        ) : (
          <>
            <AQIDisplay value={data.aqi} className="mb-16" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SensorCard
                title="Temperature"
                value={data.temperature}
                unit="°C"
                icon={Thermometer}
                glowColor="yellow"
              />
              <SensorCard
                title="Humidity"
                value={data.humidity}
                unit="%"
                icon={Droplets}
                glowColor="green"
              />
              <SensorCard
                title="PM2.5"
                value={data.pm25}
                unit="µg/m³"
                icon={Wind}
                glowColor="red"
              />
              <SensorCard
                title="PM10"
                value={data.pm10}
                unit="µg/m³"
                icon={CloudRain}
                glowColor="purple"
              />
              <SensorCard
                title="CO"
                value={data.co}
                unit="PPM"
                icon={Factory}
                glowColor="red"
              />
              <SensorCard
                title="Air Quality"
                value={data.airQuality}
                unit="ppm"
                icon={Factory}
                glowColor="purple"
              />
            </div>
          </>
        )}
        
        <div className="mt-8">
          <AQIChart />
        </div>

        <footer className="mt-16 text-center text-sm text-white/40">
          <p>Real-time monitoring system ©2025</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;