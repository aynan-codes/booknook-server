import { Response } from "express";
import { getDB } from "../config/db";
import { getBorrowCollection } from "../models/borrow.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const getMyBorrows = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Please login first.",
      });
      return;
    }

    const borrowCollection = getBorrowCollection(getDB());

    const borrows = await borrowCollection
      .find({
        userId,
        status: "borrowed",
      })
      .sort({ borrowedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Your borrowed books fetched successfully",
      data: borrows,
    });
  } catch (error) {
    console.error("Get my borrows error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your borrowed books",
    });
  }
};