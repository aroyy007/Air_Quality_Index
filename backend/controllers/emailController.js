import EmailSubscription from "../models/EmailSubscription.js";
import nodemailer from "nodemailer";
import SensorData from "../models/SensorData.js";

// Subscribe for email alerts
export const subscribeEmail = async (req, res) => {
  try {
    const { email, threshold = 100 } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email already exists
    const existingSubscription = await EmailSubscription.findOne({ email });
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.threshold = threshold;
      existingSubscription.active = true;
      await existingSubscription.save();
      
      return res.status(200).json({
        message: "Subscription updated successfully",
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const newSubscription = new EmailSubscription({
      email,
      threshold
    });

    await newSubscription.save();

    // Send confirmation email
    await sendConfirmationEmail(email, threshold);

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: newSubscription
    });
  } catch (error) {
    console.error("Email subscription error:", error);
    res.status(500).json({
      error: "Failed to subscribe",
      details: error.message
    });
  }
};

// Unsubscribe from email alerts
export const unsubscribeEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const subscription = await EmailSubscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Instead of deleting, just mark as inactive
    subscription.active = false;
    await subscription.save();

    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({
      error: "Failed to unsubscribe",
      details: error.message
    });
  }
};

// Check and send alerts if needed (called by a scheduled job)
export const checkAndSendAlerts = async () => {
  try {
    // Get the latest sensor data
    const latestData = await SensorData.findOne().sort({ createdAt: -1 }).lean();
    
    if (!latestData || !latestData.aqi) {
      console.log("No sensor data available for alerts");
      return;
    }

    const currentAQI = latestData.aqi;
    console.log(`Current AQI: ${currentAQI}, checking for alert thresholds...`);

    // Find all active subscriptions with thresholds exceeded
    const timeBuffer = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const sixHoursAgo = new Date(Date.now() - timeBuffer);

    const subscriptionsToNotify = await EmailSubscription.find({
      active: true,
      threshold: { $lte: currentAQI },
      $or: [
        { lastNotified: null },
        { lastNotified: { $lt: sixHoursAgo } }
      ]
    });

    console.log(`Found ${subscriptionsToNotify.length} subscriptions to notify`);

    // Send emails
    for (const subscription of subscriptionsToNotify) {
      await sendAlertEmail(subscription.email, currentAQI, subscription.threshold);
      
      // Update lastNotified timestamp
      subscription.lastNotified = new Date();
      await subscription.save();
    }

    return subscriptionsToNotify.length;
  } catch (error) {
    console.error("Alert check error:", error);
  }
};

// Helper function to send confirmation email
const sendConfirmationEmail = async (email, threshold) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Air Quality Monitor" <noreply@airquality.example.com>',
      to: email,
      subject: "Air Quality Alert Subscription Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Subscription Confirmed</h2>
          <p>Thank you for subscribing to Air Quality alerts. You will receive notifications when the AQI exceeds ${threshold}.</p>
          <p>Current threshold: <strong>${threshold}</strong> (${getAQICategory(threshold)})</p>
          <p>Stay healthy!</p>
        </div>
      `
    });

    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
};

// Helper function to send alert email
const sendAlertEmail = async (email, currentAQI, threshold) => {
  try {
    const transporter = createTransporter();

    const category = getAQICategory(currentAQI);
    const recommendations = getRecommendations(currentAQI);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Air Quality Monitor" <noreply@airquality.example.com>',
      to: email,
      subject: `⚠️ ALERT: Air Quality Index Has Reached ${currentAQI}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${getColorForAQI(currentAQI)};">Air Quality Alert</h2>
          <p>The Air Quality Index (AQI) in your area has reached <strong>${currentAQI}</strong>, which is considered <strong>${category}</strong>.</p>
          <p>This exceeds your alert threshold of ${threshold}.</p>
          
          <h3>Recommendations:</h3>
          <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
          
          <p>This is an automated alert from your Air Quality Monitoring System.</p>
          <p style="font-size: 0.8em; color: #888;">To change your alert settings or unsubscribe, please visit the Air Quality Monitor dashboard.</p>
        </div>
      `
    });

    console.log(`Alert email sent to ${email} for AQI ${currentAQI}`);
  } catch (error) {
    console.error("Error sending alert email:", error);
  }
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "user@example.com",
      pass: process.env.EMAIL_PASSWORD || "password"
    }
  });
};

// Helper functions for email content
const getAQICategory = (aqi) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const getColorForAQI = (aqi) => {
  if (aqi <= 50) return "#4caf50";  // green
  if (aqi <= 100) return "#ffeb3b"; // yellow
  if (aqi <= 150) return "#ff9800"; // orange
  if (aqi <= 200) return "#f44336"; // red
  if (aqi <= 300) return "#9c27b0"; // purple
  return "#880e4f";                 // dark purple
};

const getRecommendations = (aqi) => {
  if (aqi <= 50) {
    return [
      "Air quality is good. Enjoy outdoor activities.",
      "No special precautions needed."
    ];
  } else if (aqi <= 100) {
    return [
      "Air quality is acceptable but moderate.",
      "Unusually sensitive people should consider reducing prolonged outdoor exertion.",
      "Keep windows closed if you have respiratory conditions."
    ];
  } else if (aqi <= 150) {
    return [
      "Members of sensitive groups may experience health effects.",
      "Reduce prolonged or heavy outdoor exertion.",
      "Take more breaks during outdoor activities.",
      "Consider wearing a mask outdoors if you have respiratory conditions."
    ];
  } else if (aqi <= 200) {
    return [
      "Everyone may begin to experience health effects.",
      "Avoid prolonged or heavy outdoor exertion.",
      "Consider moving activities indoors.",
      "Wear a mask outdoors.",
      "Keep windows closed."
    ];
  } else {
    return [
      "Health alert: everyone may experience more serious health effects.",
      "Avoid all outdoor physical activities.",
      "Stay indoors and keep windows and doors closed.",
      "Run air purifiers if available.",
      "Use masks if you must go outdoors.",
      "Consider relocating temporarily if conditions persist."
    ];
  }
};