import axios from "axios";
import SensorData from "../models/SensorData.js";

export const getWeatherData = async (req, res) => {
    try {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const sensorData = await SensorData.findOne().sort({ createdAt: -1 }).lean() || {};

        const [airPollution, weather] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=22.3569&lon=91.7832&appid=${apiKey}`),
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Chittagong,BD&appid=${apiKey}&units=metric`)
        ]);

        const responseData = {
            aqi: airPollution.data.list[0].main.aqi,
            temperature: weather.data.main.temp,
            humidity: weather.data.main.humidity,
            pm25: airPollution.data.list[0].components.pm2_5,
            pm10: airPollution.data.list[0].components.pm10,
            co: airPollution.data.list[0].components.co,
            methane: sensorData.methane || 0,
            airQuality: sensorData.airQuality || 0
        };

        res.json(responseData);
    } catch (error) {
        console.error("Weather API Error:", error);
        res.status(500).json({ 
            error: "Failed to fetch weather data",
            details: error.message 
        });
    }
};

export const getHistoricalData = async (req, res) => {
    try {
        const data = await SensorData.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .select('aqi createdAt -_id')
            .lean();

        const formattedData = data.map(entry => ({
            date: new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            aqi: entry.aqi
        })).reverse();

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch historical data",
            details: error.message 
        });
    }
};