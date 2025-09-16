import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import BookModel from "./bookModel";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, author, genre, coverImage, file } = req.body;

  // validation
  if (!title || !author || !genre || !coverImage || !file) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  try {
    const newBook = await BookModel.create({
      title,
      author,
      genre,
      coverImage,
      file,
    });

    res.status(201).json(newBook);
  } catch (err) {
    console.error("Error while creating book:", err);
    return next(createHttpError(500, "Error while creating book."));
  }
};

export default createBook;
