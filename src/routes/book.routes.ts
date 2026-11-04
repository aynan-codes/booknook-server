import { Router } from "express";

import {
addBook,
getAllBooks,
getBookById,
getMyBooks,
updateBook,
deleteMyBook,
} from "../controllers/book.controller";

import { borrowBook } from "../controllers/borrow.controller";
import { getMyBorrows } from "../controllers/myBorrows.controller";
import { returnBook } from "../controllers/return.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Get all books
router.get("/", getAllBooks);

// Get books added by the logged-in user
router.get("/my-books", verifyToken, getMyBooks);

// Add a new book
router.post("/", verifyToken, addBook);

// Update a book added by the logged-in user
router.patch("/:id", verifyToken, updateBook);

// Delete a book added by the logged-in user
router.delete("/:id", verifyToken, deleteMyBook);

// Get user's borrowed books
router.get("/my-borrows", verifyToken, getMyBorrows);

// Return a borrowed book
router.patch("/return/:borrowId", verifyToken, returnBook);

// Get a single book by ID
router.get("/:id", getBookById);

// Borrow a book
router.post("/:id/borrow", verifyToken, borrowBook);

export default router;
