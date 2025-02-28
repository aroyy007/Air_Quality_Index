import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import mongoose from "mongoose";
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

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
            
            // Validate and save sensor data
            if (sensorData.co && sensorData.aq && sensorData.ch4) {
                const newEntry = new mongoose.models.SensorData({
                    co: (sensorData.co / 1024) * 1000,
                    aqi: (sensorData.aq / 1024) * 500,
                    methane: sensorData.ch4
                });
                
                await newEntry.save();
                console.log('Sensor data saved:', newEntry);
            }
        } catch (error) {
            console.error('Arduino Data Error:', error.message);
        }
    });

    arduinoPort.on('error', (err) => {
        console.error('Serial Port Error:', err.message);
    });
} catch (error) {
    console.error('Serial Port Initialization Error:', error.message);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});