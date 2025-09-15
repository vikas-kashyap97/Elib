import mongoose from "mongoose";
import { config } from "./config";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUrl as string, {});

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}
