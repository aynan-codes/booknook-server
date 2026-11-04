import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import bookRoutes from "./routes/book.routes";

// DNS Configuration
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Initialize Express
const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://booknook-library.netlify.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();