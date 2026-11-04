import { ObjectId, Db, Collection } from "mongodb";

export interface Borrow {
  _id?: ObjectId;
  userId: string;
  bookId: number;
  bookTitle: string;
  borrowedAt: Date;
  status: "borrowed" | "returned";
}

export const getBorrowCollection = (
  db: Db
): Collection<Borrow> => {
  return db.collection<Borrow>("borrows");
};