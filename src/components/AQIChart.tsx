import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const AQIChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/weather/historical');
                if (!response.ok) {
                    throw new Error(`Historical data error: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
                setError(null);
            } catch (error) {
                console.error("Historical fetch error:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalData();
        const interval = setInterval(fetchHistoricalData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        const color = payload.aqi >= 100 ? "#ea384c" :
            payload.aqi <= 50 ? "#4caf50" :
                "#8884d8";

        return (
            <circle
                cx={cx}
                cy={cy}
                r={4}
                stroke={color}
                strokeWidth={2}
                fill="#1a1a1a"
            />
        );
    };

    return (
        <div className="w-full h-[300px] md:h-[400px] glass-panel p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-white/90">
                AQI Trend - Last 30 Days
            </h2>

            {error ? (
                <div className="text-center text-red-500 h-full flex items-center justify-center">
                    Chart data unavailable: {error}
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="date"
                            stroke="#ffffff60"
                            tick={{ fill: "#ffffff60", fontSize: 12 }}
                            tickLine={{ stroke: "#ffffff30" }}
                        />
                        <YAxis
                            stroke="#ffffff60"
                            tick={{ fill: "#ffffff60", fontSize: 12 }}
                            tickLine={{ stroke: "#ffffff30" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                            }}
                            formatter={(value: number) => [value, "AQI"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="aqi"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={<CustomDot />}
                            activeDot={{ r: 6 }}
                            animationDuration={1000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default AQIChart;