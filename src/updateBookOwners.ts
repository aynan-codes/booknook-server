import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { connectDB, getDB } from "./config/db";

const updateBookOwners = async () => {
  try {
    await connectDB();

    const books = getDB().collection("books");

    const result = await books.updateMany(
      {},
      {
        $set: {
          addedByName: "Abu Baten",
          addedByEmail: "sayeem388@gmail.com",
        },
      }
    );

    console.log("Book owner information updated!");
    console.log("Matched books:", result.matchedCount);
    console.log("Updated books:", result.modifiedCount);
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    process.exit(0);
  }
};

updateBookOwners();