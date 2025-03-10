import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import mongoose from "mongoose";
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import SensorData from "./models/SensorData.js";
import { checkAndSendAlerts } from "./controllers/emailController.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:8080",
}));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/sensors", sensorRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", emailRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Serial port setup
try {
    const arduinoPort = new SerialPort({
        path: 'COM3', // Update with your port
        baudRate: 9600
    });

    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', async (rawData) => {
        try {
            const sensorData = JSON.parse(rawData);
            console.log("Received data from Arduino:", sensorData);
            
            // Map Arduino data to our schema
            if (sensorData) {
                const newEntry = new SensorData({
                    co: sensorData.co || 0,
                    aqi: sensorData.aqi || 0,
                    methane: sensorData.ch4 || 0,
                    airQuality: sensorData.air_quality || 0,
                    // Set default values for fields not provided by Arduino
                    temperature: 0,
                    humidity: 0,
                    pm25: 0,
                    pm10: 0
                });
                
                await newEntry.save();
                console.log('Sensor data saved:', newEntry);
                
                // Check for alerts after new data is received
                checkAndSendAlerts();
            }
        } catch (error) {
            console.error('Arduino Data Error:', error.message);
            console.error('Raw data received:', rawData);
        }
    });

    arduinoPort.on('error', (err) => {
        console.error('Serial Port Error:', err.message);
    });
} catch (error) {
    console.error('Serial Port Initialization Error:', error.message);
    console.log('Continuing without serial port. Data will only come from OpenWeatherMap API.');
}

// Set up scheduled alert checks (every 15 minutes)
setInterval(async () => {
    console.log("Running scheduled alert check...");
    try {
        const notifiedCount = await checkAndSendAlerts();
        console.log(`Alert check complete. Sent ${notifiedCount || 0} notifications.`);
    } catch (error) {
        console.error("Scheduled alert check failed:", error);
    }
}, 15 * 60 * 1000); // 15 minutes in milliseconds

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});