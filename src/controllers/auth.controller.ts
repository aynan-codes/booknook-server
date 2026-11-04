import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { getUserCollection } from "../models/user.model";
import { getDB } from "../config/db";

// ==============================
// REGISTER USER
// ==============================

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const users = getUserCollection(getDB());
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// LOGIN USER
// ==============================

export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const users = getUserCollection(getDB());

    const user = await users.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        success: false,
        message: "Please set a password for your Google account first",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { userId: user._id!.toString() },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// GET MY PROFILE (PROTECTED)
// ==============================

export const getMyProfile = async (
  req: Request & { userId?: string },
  res: Response
): Promise<void> => {
  try {
    if (!req.userId || !ObjectId.isValid(req.userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid user authentication",
      });
      return;
    }

    const users = getUserCollection(getDB());

    const user = await users.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// UPDATE MY PROFILE (PROTECTED)
// ==============================

export const updateMyProfile = async (
  req: Request & { userId?: string },
  res: Response
): Promise<void> => {
  try {
    if (!req.userId || !ObjectId.isValid(req.userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid user authentication",
      });
      return;
    }

    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Valid name and email are required",
      });
      return;
    }

    const users = getUserCollection(getDB());
    const userId = new ObjectId(req.userId);
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await users.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
      return;
    }

    const result = await users.updateOne(
      { _id: userId },
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updatedUser = await users.findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// SET PASSWORD FOR GOOGLE USER
// ==============================

export const setPassword = async (
  req: Request & { userId?: string },
  res: Response
): Promise<void> => {
  try {
    const { password } = req.body;

    if (!req.userId || !ObjectId.isValid(req.userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid user authentication",
      });
      return;
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const users = getUserCollection(getDB());
    const userId = new ObjectId(req.userId);

    const user = await users.findOne({ _id: userId });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.password) {
      res.status(409).json({
        success: false,
        message: "Password is already set",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await users.updateOne(
      {
        _id: userId,
        password: "",
      },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    if (result.modifiedCount === 0) {
      res.status(409).json({
        success: false,
        message: "Password is already set",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Set Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};