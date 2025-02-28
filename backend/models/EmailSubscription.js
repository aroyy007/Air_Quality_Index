import mongoose from "mongoose";

const emailSubscriptionSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
        },
        threshold: {
            type: Number,
            required: true,
            default: 100, // Default threshold: moderate air quality
            min: 50,
            max: 300
        },
        lastNotified: {
            type: Date,
            default: null
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("EmailSubscription", emailSubscriptionSchema);