import { Response } from "express";
import { ObjectId } from "mongodb";
import { client, getDB } from "../config/db";
import { getBookCollection } from "../models/book.model";
import { getBorrowCollection } from "../models/borrow.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const returnBook = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.userId;

  const borrowId = Array.isArray(req.params.borrowId)
    ? req.params.borrowId[0]
    : req.params.borrowId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Please login first.",
    });
    return;
  }

  if (!borrowId || !ObjectId.isValid(borrowId)) {
    res.status(400).json({
      success: false,
      message: "Invalid borrow ID.",
    });
    return;
  }

  const session = client.startSession();

  try {
    const db = getDB();
    const borrowCollection = getBorrowCollection(db);
    const bookCollection = getBookCollection(db);

    await session.withTransaction(async () => {
      const borrow = await borrowCollection.findOne(
        {
          _id: new ObjectId(borrowId),
          userId,
          status: "borrowed",
        },
        { session }
      );

      if (!borrow) {
        throw new Error("BORROW_NOT_FOUND");
      }

      const updateResult = await borrowCollection.updateOne(
        {
          _id: borrow._id,
          userId,
          status: "borrowed",
        },
        {
          $set: { status: "returned" },
        },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("ALREADY_RETURNED");
      }

      const bookUpdate = await bookCollection.updateOne(
        { id: borrow.bookId },
        { $inc: { copies: 1 } },
        { session }
      );

      if (bookUpdate.matchedCount === 0) {
        throw new Error("BOOK_NOT_FOUND");
      }
    });

    res.status(200).json({
      success: true,
      message: "Book returned successfully!",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message === "BORROW_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Active borrow record not found.",
      });
      return;
    }

    if (message === "ALREADY_RETURNED") {
      res.status(400).json({
        success: false,
        message: "This book has already been returned.",
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

    console.error("Return book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to return book.",
    });
  } finally {
    await session.endSession();
  }
};