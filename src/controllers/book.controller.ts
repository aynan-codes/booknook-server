import { Request, Response } from "express";
import { getDB } from "../config/db";
import { getBookCollection } from "../models/book.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Get all books
export const getAllBooks = async (
  _req: Request,
  res: Response
) => {
  try {
    const collection = getBookCollection(getDB());

    const books = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};

// Get a single book by ID
export const getBookById = async (
  req: Request,
  res: Response
) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const collection = getBookCollection(getDB());
    const book = await collection.findOne({ id: bookId });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
};

// Add a new book
export const addBook = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      title,
      author,
      category,
      rating,
      description,
      isbn,
      coverImage,
      copies,
    } = req.body;

    const validCategories = [
      "Fiction",
      "Science",
      "History",
      "Kids",
      "Others",
    ];

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      !validCategories.includes(category) ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof isbn !== "string" ||
      !isbn.trim() ||
      typeof coverImage !== "string" ||
      !coverImage.trim() ||
      !Number.isInteger(Number(copies)) ||
      Number(copies) < 0 ||
      !Number.isFinite(Number(rating)) ||
      Number(rating) < 0 ||
      Number(rating) > 5
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide valid book information",
      });
      return;
    }

    if (!req.userEmail) {
      res.status(401).json({
        success: false,
        message: "Please login first",
      });
      return;
    }

    const books = getBookCollection(getDB());

    const lastBook = await books.findOne(
      {},
      { sort: { id: -1 } }
    );

    const newBook = {
      id: (lastBook?.id || 0) + 1,
      title: title.trim(),
      author: author.trim(),
      category,
      rating: Number(rating),
      description: description.trim(),
      isbn: isbn.trim(),
      coverImage: coverImage.trim(),
      copies: Number(copies),
      addedByName: req.userName || "",
      addedByEmail: req.userEmail,
      createdAt: new Date(),
    };

    await books.insertOne(newBook);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    console.error("Add book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
};

// Get books added by the logged-in user
export const getMyBooks = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userEmail) {
      res.status(401).json({
        success: false,
        message: "Please login first",
      });
      return;
    }

    const books = await getBookCollection(getDB())
      .find({ addedByEmail: req.userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Your books fetched successfully",
      data: books,
    });
  } catch (error) {
    console.error("Get my books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your books",
    });
  }
};

// Update a book added by the logged-in user
export const updateBook = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    if (!req.userEmail) {
      res.status(401).json({
        success: false,
        message: "Please login first",
      });
      return;
    }

    const {
      title,
      author,
      category,
      rating,
      description,
      isbn,
      coverImage,
      copies,
    } = req.body;

    const validCategories = [
      "Fiction",
      "Science",
      "History",
      "Kids",
      "Others",
    ];

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      !validCategories.includes(category) ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof isbn !== "string" ||
      !isbn.trim() ||
      typeof coverImage !== "string" ||
      !coverImage.trim() ||
      !Number.isFinite(Number(rating)) ||
      Number(rating) < 0 ||
      Number(rating) > 5 ||
      !Number.isInteger(Number(copies)) ||
      Number(copies) < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide valid book information",
      });
      return;
    }

    const books = getBookCollection(getDB());

    const result = await books.updateOne(
      {
        id: bookId,
        addedByEmail: req.userEmail,
      },
      {
        $set: {
          title: title.trim(),
          author: author.trim(),
          category,
          rating: Number(rating),
          description: description.trim(),
          isbn: isbn.trim(),
          coverImage: coverImage.trim(),
          copies: Number(copies),
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Book not found or you are not allowed to update it",
      });
      return;
    }

    const updatedBook = await books.findOne({
      id: bookId,
      addedByEmail: req.userEmail,
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
};

// Delete a book added by the logged-in user
export const deleteMyBook = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    if (!req.userEmail) {
      res.status(401).json({
        success: false,
        message: "Please login first",
      });
      return;
    }

    const books = getBookCollection(getDB());

    const result = await books.deleteOne({
      id: bookId,
      addedByEmail: req.userEmail,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Book not found or you are not allowed to delete it",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
};