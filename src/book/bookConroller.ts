import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";

export interface AuthRequest extends Request {
  userId: string;
}

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // ---- COVER IMAGE ----
    if (!files?.coverImage?.[0]) {
      return res.status(400).json({ error: "Cover image is required" });
    }

    const coverFile = files.coverImage[0];
    const conveImageMimeType = coverFile.mimetype.split("/").at(-1);
    const coverFileName = coverFile.filename;

    if (!coverFileName) {
      return res.status(400).json({ error: "Cover image file name missing" });
    }

    const coverFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      coverFileName
    );

    // Cloudinary-supported formats
    const allowedFormats = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "bmp",
      "tiff",
      "ico",
      "pdf",
      "heic",
    ] as const;

    // Narrow type without using "any"
    const format = (allowedFormats as readonly string[]).includes(
      conveImageMimeType ?? ""
    )
      ? (conveImageMimeType as (typeof allowedFormats)[number])
      : "jpg";

    const coverUploadOptions = {
      public_id: coverFileName,
      folder: "book-covers",
      format,
    };

    const coverUploadResult = await cloudinary.uploader.upload(
      coverFilePath,
      coverUploadOptions
    );

    // ---- BOOK FILE (PDF) ----
    if (!files?.file?.[0]) {
      return res.status(400).json({ error: "Book file (PDF) is required" });
    }

    const bookFile = files.file[0];
    const bookFileName = bookFile.filename;

    if (!bookFileName) {
      return res.status(400).json({ error: "Book file name missing" });
    }

    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookUploadOptions = {
      public_id: bookFileName,
      folder: "book-pdfs",
      resource_type: "raw" as const,
      format: "pdf",
    };

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      bookUploadOptions
    );

    const _req = req as AuthRequest;
    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: coverUploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete Temp files

    await fs.promises.unlink(coverFilePath);
    await fs.promises.unlink(bookFilePath);

    // ---- RESPONSE ----
    return res.status(201).json({
      book: newBook,
      cover: coverUploadResult,
      bookFileUpload: bookFileUploadResult,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading the files"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const { bookId } = req.params;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    const _req = req as AuthRequest;

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "Unauthorized"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // ---- UPDATE COVER IMAGE (if provided) ----
    let updatedCoverUrl = book.coverImage;
    if (files?.coverImage?.[0]) {
      const coverFile = files.coverImage[0];
      const coverFileName = coverFile.filename;
      const conveImageMimeType = coverFile.mimetype.split("/").at(-1);
      const coverFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        coverFileName
      );

      const allowedFormats = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "bmp",
        "tiff",
        "ico",
        "pdf",
        "heic",
      ] as const;

      const format = (allowedFormats as readonly string[]).includes(
        conveImageMimeType ?? ""
      )
        ? (conveImageMimeType as (typeof allowedFormats)[number])
        : "jpg";

      const coverUploadResult = await cloudinary.uploader.upload(
        coverFilePath,
        {
          public_id: coverFileName,
          folder: "book-covers",
          format,
        }
      );

      updatedCoverUrl = coverUploadResult.secure_url;

      await fs.promises.unlink(coverFilePath);
    }

    // ---- UPDATE BOOK FILE (if provided) ----
    let updatedBookFileUrl = book.file;
    if (files?.file?.[0]) {
      const bookFile = files.file[0];
      const bookFileName = bookFile.filename;
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      const bookFileUploadResult = await cloudinary.uploader.upload(
        bookFilePath,
        {
          public_id: bookFileName,
          folder: "book-pdfs",
          resource_type: "raw" as const,
          format: "pdf",
        }
      );

      updatedBookFileUrl = bookFileUploadResult.secure_url;

      await fs.promises.unlink(bookFilePath);
    }

    // ---- UPDATE DB ----
    book.title = title ?? book.title;
    book.genre = genre ?? book.genre;
    book.coverImage = updatedCoverUrl;
    book.file = updatedBookFileUrl;

    const updatedBook = await book.save();

    return res.status(200).json({
      book: updatedBook,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while updating the book"));
  }
};

export { createBook, updateBook };
