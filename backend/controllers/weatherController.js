import axios from "axios";

export const getWeatherData = async (req, res) => {
    try {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const city = process.env.CITY_NAME;

        const { data } = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=23.8103&lon=90.4125&appid=${apiKey}`
        );

        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );

        const responseData = {
            aqi: data.list[0].main.aqi,
            temperature: weatherResponse.data.main.temp,
            humidity: weatherResponse.data.main.humidity,
            pm25: data.list[0].components.pm2_5,
            pm10: data.list[0].components.pm10,
            co: data.list[0].components.co
        };

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
};
