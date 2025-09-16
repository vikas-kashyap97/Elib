import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";

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

    console.log("bookFileUploadResult", bookFileUploadResult);

    const newBook = await bookModel.create({
      title,
      genre,
      author: "68c7f54d9da2023b471bc226",
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

export default createBook;
