import { ObjectId, Db, Collection } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export const getUserCollection = (
  db: Db
): Collection<User> => {
  return db.collection<User>("users");
};