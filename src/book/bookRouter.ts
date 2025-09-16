import express from "express";
import createBook from "./bookConroller";
const bookRouter = express.Router();

// Routes
bookRouter.post("/", createBook);

export default bookRouter;
