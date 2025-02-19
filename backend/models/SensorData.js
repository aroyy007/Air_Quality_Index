import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema(
  {
    aqi: Number,
    temperature: Number,
    humidity: Number,
    pm25: Number,
    pm10: Number,
    co: Number,
  },
  { timestamps: true }
);

export default mongoose.model("SensorData", sensorDataSchema);
