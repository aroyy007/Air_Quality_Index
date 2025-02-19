import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";


dotenv.config(); // ✅ Load .env file

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:8080", // Replace with your frontend URL
  }));

connectDB(); // ✅ Connect to MongoDB AFTER loading .env

app.use("/api/sensors", sensorRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

