import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";

const app = express();
app.use(express.json());

// Routes
// HTTP methods: GET, PUT, POST, PATCH
app.get("/", (req, res) => {
  res.json({ message: "Welcome to elib api." });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
