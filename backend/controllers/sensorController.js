import SensorData from "../models/SensorData.js";

// Store sensor data from Arduino
export const saveSensorData = async (req, res) => {
    try {
        const { aqi, temperature, humidity, pm25, pm10, co } = req.body;
        const data = new SensorData({ aqi, temperature, humidity, pm25, pm10, co });

        await data.save();
        res.status(201).json({ message: "Sensor data saved successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save data" });
    }
};

// Fetch latest sensor data
export const getSensorData = async (req, res) => {
    try {
        const data = await SensorData.find().sort({ createdAt: -1 }).limit(1);
        console.log("Fetched data:", data); // Log the fetched data
        res.json(data[0] || {});
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
};
