
import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SensorCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  glowColor?: "green" | "yellow" | "red" | "purple";
}

const SensorCard = ({
  title,
  value,
  unit,
  icon: Icon,
  glowColor,
  className,
  ...props
}: SensorCardProps) => {
  const getValueColor = () => {
    switch (title.toLowerCase()) {
      case "temperature":
        return "text-[#D946EF]"; // Magenta Pink
      case "humidity":
        return "text-[#0EA5E9]"; // Ocean Blue
      case "pm2.5":
        return "text-[#8B5CF6]"; // Vivid Purple
      case "pm10":
        return "text-[#F97316]"; // Bright Orange
      case "co":
        return "text-[#8B5CF6]"; // Vivid Purple
      default:
        return "text-white";
    }
  };

  return (
    <div
      className={cn(
        "glass-panel p-6 glow transition-all duration-300 hover:scale-105",
        glowColor && `glow-${glowColor}`,
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <h3 className="text-sm font-medium text-white/90">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-3xl font-semibold animate-number-change",
          getValueColor(),
          "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
        )}>
          {value}
        </span>
        <span className="text-sm text-white/80">{unit}</span>
      </div>
    </div>
  );
};

export default SensorCard;
