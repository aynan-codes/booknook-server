import { ObjectId, Db, Collection } from "mongodb";

export type BookCategory =
| "Fiction"
| "Science"
| "History"
| "Kids"
| "Others";

export interface Book {
_id?: ObjectId;
id: number;
title: string;
author: string;
category: BookCategory;
rating: number;
description: string;
isbn: string;
coverImage: string;
copies: number;
addedByName: string;
addedByEmail: string;
createdAt?: Date;
}

export const getBookCollection = (db: Db): Collection<Book> => {
return db.collection<Book>("books");
};
