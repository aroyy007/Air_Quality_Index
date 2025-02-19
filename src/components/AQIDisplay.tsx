
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AQIDisplayProps {
  value: number;
  className?: string;
}

const AQIDisplay = ({ value, className }: AQIDisplayProps) => {
  const [status, setStatus] = useState({
    text: "",
    color: "",
  });

  useEffect(() => {
    if (value <= 50) {
      setStatus({ text: "Air quality is good. No health concerns.", color: "green" });
    } else if (value <= 100) {
      setStatus({ text: "Air quality is moderate. Sensitive individuals should limit outdoor activity.", color: "yellow" });
    } else if (value <= 150) {
      setStatus({ text: "Air quality is unhealthy. Reduce outdoor activities.", color: "red" });
    } else {
      setStatus({ text: "Air quality is hazardous. Avoid outdoor activities.", color: "purple" });
    }
  }, [value]);

  const getTextColor = () => {
    switch (status.color) {
      case "green":
        return "text-aqi-good";
      case "yellow":
        return "text-aqi-moderate";
      case "red":
        return "text-aqi-unhealthy";
      case "purple":
        return "text-aqi-hazardous";
      default:
        return "text-white";
    }
  };

  return (
    <div className={cn("text-center space-y-4", className)}>
      <div 
        className={cn(
          "glow inline-block p-8 glass-panel transition-transform duration-300 hover:scale-105 hover:shadow-2xl", 
          `glow-${status.color}`
        )}
      >
        <h1 
          className={cn(
            "text-6xl font-bold mb-2 animate-number-change",
            getTextColor(),
            "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          )}
        >
          {value}
        </h1>
        <p className="text-xl text-white/90">AQI</p>
      </div>
      <p className="text-lg text-white/80 max-w-md mx-auto animate-fade-in drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        {status.text}
      </p>
    </div>
  );
};

export default AQIDisplay;
