import "dotenv/config";
import dns from "node:dns";
import { MongoClient, Db } from "mongodb";

// Use Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

export const client = new MongoClient(uri);

let database: Db;

export const connectDB = async (): Promise<Db> => {
  await client.connect();

  database = client.db(process.env.DB_NAME || "booknook");

  console.log("MongoDB Connected Successfully!");

  return database;
};

export const getDB = (): Db => {
  if (!database) {
    throw new Error("Database is not connected yet!");
  }

  return database;
};