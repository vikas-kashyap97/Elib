import express from "express";
import {
  createBook,
  updateBook,
  listBooks,
  getSingleBook,
  deleteBook,
} from "./bookConroller";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";
const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 3e7 }, // 30MB
});

// Routes
bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/", listBooks);
bookRouter.get("/:bookId", getSingleBook);
bookRouter.delete("/:bookId", authenticate, deleteBook);

export default bookRouter;
