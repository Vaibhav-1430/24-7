import { connectDB } from "./db.js";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: String,
    hostel: String,
    roomNumber: String,
    password: String
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    await connectDB();

    const data = JSON.parse(event.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User already exists" })
      };
    }

    await User.create(data);

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: "Signup successful" })
    };
  } catch (err) {
    console.error("Signup error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
