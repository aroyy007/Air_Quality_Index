import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, CloudRain, Factory } from "lucide-react";
import AQIDisplay from "@/components/AQIDisplay";
import SensorCard from "@/components/SensorCard";
import { Meteors } from "@/components/Meteors";
import AQIChart from "@/components/AQIChart";
import AlertSubscription from "@/components/AlertSubscription";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SensorReading {
  aqi: number;
  temperature: number;
  humidity: number;
  pm25: number;
  pm10: number;
  co: number;
  methane: number;
  airQuality: number;
}

interface SensorStatus {
  status: "good" | "moderate" | "unhealthy" | "hazardous";
  message: string;
  color: "green" | "yellow" | "red" | "purple";
}

const Index = () => {
  const [data, setData] = useState<SensorReading>({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    pm25: 0,
    pm10: 0,
    co: 0,
    methane: 0,
    airQuality: 0,
  });

  const [sensorStatuses, setSensorStatuses] = useState<Record<string, SensorStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<SensorStatus>({
    status: "good",
    message: "Air quality is good. Safe to go outside.",
    color: "green",
  });

  // Define threshold values for each parameter
  const thresholds = {
    temperature: {
      good: { max: 25, message: "Comfortable temperature.", color: "green" as "green" },
      moderate: { max: 30, message: "Moderate temperature. Consider shade when outside.", color: "yellow" as "yellow" },
      unhealthy: { max: 35, message: "High temperature. Stay hydrated.", color: "red" as "red" },
      hazardous: { message: "Extreme temperature. Avoid outdoor activities.", color: "purple" as "purple" },
    },
    humidity: {
      good: { max: 50, message: "Comfortable humidity level.", color: "green" as "green" },
      moderate: { max: 65, message: "Moderate humidity level.", color: "yellow" as "yellow" },
      unhealthy: { max: 80, message: "High humidity. May cause discomfort.", color: "red" as "red" },
      hazardous: { message: "Very high humidity. Limit outdoor exposure.", color: "purple" as "purple" },
    },
    pm25: {
      good: { max: 12, message: "Good PM2.5 levels.", color: "green" as "green" },
      moderate: { max: 35.4, message: "Moderate PM2.5 levels. Sensitive individuals should use caution.", color: "yellow" as "yellow" },
      unhealthy: { max: 55.4, message: "Unhealthy PM2.5 levels. Consider wearing a mask.", color: "red" as "red" },
      hazardous: { message: "Hazardous PM2.5 levels. Stay indoors.", color: "purple" as "purple" },
    },
    pm10: {
      good: { max: 54, message: "Good PM10 levels.", color: "green" as "green" },
      moderate: { max: 154, message: "Moderate PM10 levels. Sensitive individuals should use caution.", color: "yellow" as "yellow" },
      unhealthy: { max: 254, message: "Unhealthy PM10 levels. Consider wearing a mask.", color: "red" as "red" },
      hazardous: { message: "Hazardous PM10 levels. Stay indoors.", color: "purple" as "purple" },
    },
    co: {
      good: { max: 4.4, message: "Safe CO levels.", color: "green" as "green" },
      moderate: { max: 9.4, message: "Moderate CO levels. Monitor for changes.", color: "yellow" as "yellow" },
      unhealthy: { max: 12.4, message: "Unhealthy CO levels. Ensure proper ventilation.", color: "red" as "red" },
      hazardous: { message: "Dangerous CO levels. Evacuate area and seek fresh air.", color: "purple" as "purple" },
    },
    methane: {
      good: { max: 2, message: "Safe methane levels.", color: "green" as "green" },
      moderate: { max: 5, message: "Moderate methane levels. Monitor for changes.", color: "yellow" as "yellow" },
      unhealthy: { max: 10, message: "Elevated methane levels. Ensure proper ventilation.", color: "red" as "red" },
      hazardous: { message: "High methane levels. Risk of flammability.", color: "purple" as "purple" },
    },
    airQuality: {
      good: { max: 50, message: "Good air quality.", color: "green" as "green" },
      moderate: { max: 100, message: "Moderate air quality.", color: "yellow" as "yellow" },
      unhealthy: { max: 150, message: "Poor air quality. Limit outdoor exposure.", color: "red" as "red" },
      hazardous: { message: "Very poor air quality. Stay indoors.", color: "purple" as "purple" },
    },
  };

  // Calculate AQI based on the highest pollutant value
  const calculateAQI = (pm25: number, pm10: number, co: number): number => {
    const aqiPM25 = calculateAQIForPollutant(pm25, "pm25");
    const aqiPM10 = calculateAQIForPollutant(pm10, "pm10");
    const aqiCO = calculateAQIForPollutant(co, "co");

    return Math.max(aqiPM25, aqiPM10, aqiCO);
  };

  // Calculate AQI for a specific pollutant
  const calculateAQIForPollutant = (value: number, pollutant: string): number => {
    if (pollutant === "pm25") {
      if (value <= 12) return (value / 12) * 50; // Good
      if (value <= 35.4) return 50 + ((value - 12) / (35.4 - 12)) * 50; // Moderate
      if (value <= 55.4) return 100 + ((value - 35.4) / (55.4 - 35.4)) * 50; // Unhealthy
      if (value <= 150.4) return 150 + ((value - 55.4) / (150.4 - 55.4)) * 100; // Very Unhealthy
      return 250 + ((value - 150.4) / (250.4 - 150.4)) * 100; // Hazardous
    }
    // Add logic for PM10, CO, etc.
    return 0;
  };

  // Determine status based on value and thresholds
  const determineStatus = (param: string, value: number): SensorStatus => {
    const paramThresholds = thresholds[param as keyof typeof thresholds];

    if (value <= paramThresholds.good.max) {
      return { status: "good", message: paramThresholds.good.message, color: paramThresholds.good.color };
    } else if (value <= paramThresholds.moderate.max) {
      return { status: "moderate", message: paramThresholds.moderate.message, color: paramThresholds.moderate.color };
    } else if (value <= paramThresholds.unhealthy.max) {
      return { status: "unhealthy", message: paramThresholds.unhealthy.message, color: paramThresholds.unhealthy.color };
    } else {
      return { status: "hazardous", message: paramThresholds.hazardous.message, color: paramThresholds.hazardous.color };
    }
  };

  // Determine worst status among all parameters to set overall status
  const determineOverallStatus = (statuses: Record<string, SensorStatus>): SensorStatus => {
    const priorities = { good: 0, moderate: 1, unhealthy: 2, hazardous: 3 };
    let worstStatus: SensorStatus = {
      status: "good",
      message: "Air quality is good. Safe to go outside.",
      color: "green",
    };

    Object.values(statuses).forEach((status) => {
      if (priorities[status.status] > priorities[worstStatus.status]) {
        worstStatus = status;
      }
    });

    // Generate an overall message based on worst status
    let message = "";
    switch (worstStatus.status) {
      case "good":
        message = "All parameters are at safe levels. It's safe to go outside.";
        break;
      case "moderate":
        message = "Some parameters are at moderate levels. Sensitive individuals should take precautions.";
        break;
      case "unhealthy":
        message = "Some parameters are at unhealthy levels. Consider wearing a mask when going outside.";
        break;
      case "hazardous":
        message = "Hazardous conditions detected. Stay indoors with windows closed.";
        break;
    }

    return { ...worstStatus, message };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/weather");
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const result = await response.json();

        const newData = {
          aqi: Number(calculateAQI(result.pm25 || 0, result.pm10 || 0, result.co || 0).toFixed(2)), // Set AQI to 2 decimal places
          temperature: result.temperature ? Number(result.temperature.toFixed(1)) : 0,
          humidity: result.humidity || 0,
          pm25: result.pm25 ? Number(result.pm25.toFixed(1)) : 0,
          pm10: result.pm10 ? Number(result.pm10.toFixed(1)) : 0,
          co: result.co ? Number(result.co.toFixed(1)) : 0,
          methane: result.methane || 0,
          airQuality: result.airQuality || 0,
        };

        setData(newData);

        // Determine status for each parameter
        const newStatuses: Record<string, SensorStatus> = {
          temperature: determineStatus("temperature", newData.temperature),
          humidity: determineStatus("humidity", newData.humidity),
          pm25: determineStatus("pm25", newData.pm25),
          pm10: determineStatus("pm10", newData.pm10),
          co: determineStatus("co", newData.co),
          methane: determineStatus("methane", newData.methane),
          airQuality: determineStatus("airQuality", newData.airQuality),
        };

        setSensorStatuses(newStatuses);
        setOverallStatus(determineOverallStatus(newStatuses));
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
            <AQIDisplay value={data.aqi} className="mb-8" />

            <Alert
              className={`glass-panel mb-8 glow glow-${overallStatus.color} border-${
                overallStatus.color === "green"
                  ? "green-500"
                  : overallStatus.color === "yellow"
                  ? "yellow-500"
                  : overallStatus.color === "red"
                  ? "red-500"
                  : "purple-500"
              }`}
            >
              <AlertTitle className="text-lg font-bold">Environmental Status</AlertTitle>
              <AlertDescription className="text-white/90">
                {overallStatus.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SensorCard
                title="Temperature"
                value={data.temperature}
                unit="°C"
                icon={Thermometer}
                glowColor={sensorStatuses.temperature?.color || "green"}
                description={sensorStatuses.temperature?.message}
              />
              <SensorCard
                title="Humidity"
                value={data.humidity}
                unit="%"
                icon={Droplets}
                glowColor={sensorStatuses.humidity?.color || "green"}
                description={sensorStatuses.humidity?.message}
              />
              <SensorCard
                title="PM2.5"
                value={data.pm25}
                unit="µg/m³"
                icon={Wind}
                glowColor={sensorStatuses.pm25?.color || "green"}
                description={sensorStatuses.pm25?.message}
              />
              <SensorCard
                title="PM10"
                value={data.pm10}
                unit="µg/m³"
                icon={CloudRain}
                glowColor={sensorStatuses.pm10?.color || "green"}
                description={sensorStatuses.pm10?.message}
              />
              <SensorCard
                title="CO"
                value={data.co}
                unit="PPM"
                icon={Factory}
                glowColor={sensorStatuses.co?.color || "green"}
                description={sensorStatuses.co?.message}
              />
              <SensorCard
                title="Air Quality"
                value={data.airQuality}
                unit="ppm"
                icon={Factory}
                glowColor={sensorStatuses.airQuality?.color || "green"}
                description={sensorStatuses.airQuality?.message}
              />
            </div>

            {/* Add the AlertSubscription component here */}
            <div className="mt-8">
              <AlertSubscription />
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