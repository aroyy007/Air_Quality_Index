import axios from "axios";
import SensorData from "../models/SensorData.js";

export const getWeatherData = async (req, res) => {
    try {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        if (!apiKey) {
            throw new Error("OpenWeatherMap API key is missing");
        }

        // Get the most recent sensor data
        const sensorData = await SensorData.findOne().sort({ createdAt: -1 }).lean() || {};
        console.log("Most recent sensor data:", sensorData);

        // Get weather data from OpenWeatherMap API
        const cityName = process.env.CITY_NAME || "Chittagong,BD";
        
        const [airPollution, weather] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=22.3569&lon=91.7832&appid=${apiKey}`),
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`)
        ]);

        // Combine data from sensors and API
        const responseData = {
            // Prefer sensor data, fallback to API data
            aqi: sensorData.aqi || airPollution.data.list[0].main.aqi || 0,
            temperature: sensorData.temperature || weather.data.main.temp || 0,
            humidity: sensorData.humidity || weather.data.main.humidity || 0,
            pm25: sensorData.pm25 || airPollution.data.list[0].components.pm2_5 || 0,
            pm10: sensorData.pm10 || airPollution.data.list[0].components.pm10 || 0,
            co: sensorData.co || airPollution.data.list[0].components.co || 0,
            methane: sensorData.methane || 0,
            airQuality: sensorData.airQuality || 0
        };

        console.log("Sending response data:", responseData);
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
        // Get the last 30 days of data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const data = await SensorData.find({
                createdAt: { $gte: thirtyDaysAgo }
            })
            .sort({ createdAt: 1 }) // Sort by date ascending
            .lean();

        // If no data is found, return empty array
        if (!data || data.length === 0) {
            return res.json([]);
        }

        // Group data by day to prevent duplicate days
        const groupedByDay = {};
        
        data.forEach(entry => {
            const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            // For each day, keep the average AQI value
            if (!groupedByDay[date]) {
                groupedByDay[date] = {
                    count: 1,
                    totalAqi: entry.aqi || 0
                };
            } else {
                groupedByDay[date].count++;
                groupedByDay[date].totalAqi += (entry.aqi || 0);
            }
        });

        // Convert grouped data to array format expected by chart
        const formattedData = Object.keys(groupedByDay).map(date => ({
            date,
            aqi: Math.round(groupedByDay[date].totalAqi / groupedByDay[date].count)
        }));

        console.log("Sending historical data:", formattedData);
        res.json(formattedData);
    } catch (error) {
        console.error("Historical data error:", error);
        res.status(500).json({ 
            error: "Failed to fetch historical data",
            details: error.message 
        });
    }
};