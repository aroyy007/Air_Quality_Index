import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, CloudRain } from "lucide-react";
import AQIDisplay from "@/components/AQIDisplay";
import SensorCard from "@/components/SensorCard";
import { Meteors } from "@/components/Meteors";

const Index = () => {
  const [data, setData] = useState({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    pm25: 0,
    pm10: 0,
    co: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/weather');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Fetched data:", result); 
        setData(result);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please check the server and try again.");
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
          <div className="text-center text-white/80">Loading data...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
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
                icon={Wind}
                glowColor="red"
              />
            </div>
          </>
        )}

        <footer className="mt-16 text-center text-sm text-white/40">
          <p>©2025 Arijit Roy</p> {/* cspell: disable-line */}
        </footer>
      </main>
    </div>
  );
};

export default Index;