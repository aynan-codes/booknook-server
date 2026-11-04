import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db";

const googleClient = new OAuth2Client(
process.env.GOOGLE_CLIENT_ID
);

export const googleLogin = async (req: Request, res: Response) => {
try {
const { credential } = req.body;


if (!credential) {
  return res.status(400).json({
    success: false,
    message: "Google credential is required",
  });
}

// Verify Google ID Token
const ticket = await googleClient.verifyIdToken({
  idToken: credential,
  audience: process.env.GOOGLE_CLIENT_ID,
});

const payload = ticket.getPayload();

if (!payload || !payload.email || !payload.email_verified) {
  return res.status(401).json({
    success: false,
    message: "Google account verification failed",
  });
}

const db = getDB();
const usersCollection = db.collection("users");
const email = payload.email.toLowerCase();

// Find existing user
let user = await usersCollection.findOne({ email });

// Create new user if not found
if (!user) {
  const newUser = {
    name: payload.name || "Google User",
    email,
    password: "",
    provider: "google",
    createdAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser);

  user = {
    ...newUser,
    _id: result.insertedId,
  };
}

// Generate JWT
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}

const token = jwt.sign(
  { userId: user._id.toString() },
  secret,
  { expiresIn: "7d" }
);

return res.status(200).json({
  success: true,
  message: "Google login successful",
  token,
  hasPassword: Boolean(user.password),
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
  },
});


} catch (error) {
console.error("Google authentication error:", error);


return res.status(401).json({
  success: false,
  message: "Google authentication failed",
});


}
};
