import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { connectDB, getDB } from "./config/db";
import { books } from "./data/books";
import { getBookCollection } from "./models/book.model";

const seedBooks = async () => {
  try {
    await connectDB();

    const collection = getBookCollection(getDB());

    // Prevent duplicate book IDs
    await collection.createIndex({ id: 1 }, { unique: true });

    const operations = books.map((book) => ({
      updateOne: {
        filter: { id: book.id },
        update: {
          $setOnInsert: {
            ...book,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations);

    console.log("Books seeding completed!");
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Already existed: ${books.length - result.upsertedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Books seeding failed:", error);
    process.exit(1);
  }
};

seedBooks();