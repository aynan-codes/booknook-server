import { Response } from "express";
import { client, getDB } from "../config/db";
import { getBookCollection } from "../models/book.model";
import { getBorrowCollection } from "../models/borrow.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const borrowBook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId;
  const bookId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Please login first.",
    });
    return;
  }

  if (!Number.isInteger(bookId) || bookId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid book ID.",
    });
    return;
  }

  const session = client.startSession();

  try {
    const db = getDB();
    const bookCollection = getBookCollection(db);
    const borrowCollection = getBorrowCollection(db);

    await session.withTransaction(async () => {
      const existingBorrow = await borrowCollection.findOne(
        { userId, bookId, status: "borrowed" },
        { session }
      );

      if (existingBorrow) {
        throw new Error("ALREADY_BORROWED");
      }

      const book = await bookCollection.findOne(
        { id: bookId },
        { session }
      );

      if (!book) {
        throw new Error("BOOK_NOT_FOUND");
      }

      const updateResult = await bookCollection.updateOne(
        { id: bookId, copies: { $gt: 0 } },
        { $inc: { copies: -1 } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("BOOK_UNAVAILABLE");
      }

      await borrowCollection.insertOne(
        {
          userId,
          bookId: book.id,
          bookTitle: book.title,
          borrowedAt: new Date(),
          status: "borrowed",
        },
        { session }
      );
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully!",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message === "ALREADY_BORROWED") {
      res.status(400).json({
        success: false,
        message: "You have already borrowed this book.",
      });
      return;
    }

    if (message === "BOOK_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    if (message === "BOOK_UNAVAILABLE") {
      res.status(400).json({
        success: false,
        message: "This book is currently unavailable.",
      });
      return;
    }

    console.error("Borrow book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to borrow book.",
    });
  } finally {
    await session.endSession();
  }
};