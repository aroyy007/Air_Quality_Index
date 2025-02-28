import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Bell } from "lucide-react";

interface AlertSubscriptionProps {
    className?: string;
}

const AlertSubscription = ({ className }: AlertSubscriptionProps) => {
    const [email, setEmail] = useState("");
    const [threshold, setThreshold] = useState(100);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email Required",
                description: "Please enter your email address",
                variant: "destructive"
            });
            return;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/alerts/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, threshold }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to subscribe");
            }

            toast({
                title: "Subscription Successful",
                description: `You'll receive alerts when AQI exceeds ${threshold}`,
            });

            setEmail("");
        } catch (error) {
            console.error("Subscription error:", error);
            toast({
                title: "Subscription Failed",
                description: error.message || "An error occurred. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getAQICategory = (value: number): string => {
        if (value <= 50) return "Good";
        if (value <= 100) return "Moderate";
        if (value <= 150) return "Unhealthy for Sensitive Groups";
        if (value <= 200) return "Unhealthy";
        if (value <= 300) return "Very Unhealthy";
        return "Hazardous";
    };

    const getSliderColor = (value: number): string => {
        if (value <= 50) return "bg-aqi-good";
        if (value <= 100) return "bg-aqi-moderate";
        if (value <= 150) return "bg-aqi-unhealthy";
        return "bg-aqi-hazardous";
    };

    return (
        <Card className={`glass-panel ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Email Alerts
                </CardTitle>
                <CardDescription>
                    Get notified when air quality becomes unhealthy
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-white/80">
                            Your Email Address
                        </label>
                        <div className="flex">
                            <div className="relative flex-grow">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-black/30 border-white/10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm text-white/80">
                                Alert Threshold (AQI)
                            </label>
                            <span className={`text-sm font-semibold ${threshold <= 50 ? "text-aqi-good" :
                                    threshold <= 100 ? "text-aqi-moderate" :
                                        threshold <= 150 ? "text-aqi-unhealthy" :
                                            "text-aqi-hazardous"
                                }`}>
                                {threshold} - {getAQICategory(threshold)}
                            </span>
                        </div>

                        <Slider
                            value={[threshold]}
                            min={50}
                            max={200}
                            step={1}
                            onValueChange={(value) => setThreshold(value[0])}
                            className={`${getSliderColor(threshold)}`}
                        />

                        <p className="text-xs text-white/60 mt-1">
                            You'll receive an email when AQI exceeds this threshold value
                        </p>
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button
                    type="submit"
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                >
                    {loading ? "Subscribing..." : "Subscribe to Alerts"}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default AlertSubscription;