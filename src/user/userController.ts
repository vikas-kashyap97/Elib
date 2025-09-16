import { NextFunction, Response, Request } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  // database call
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(400, "User is already registred.");
      return next(error);
    }
  } catch (err) {
    console.error("Error while getting user:", err);
    return next(createHttpError(500, "Error while getting user."));
  }

  // password
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    console.error("Error while creating user:", err);
    return next(createHttpError(500, "Error while creating user."));
  }

  // token generation
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // response
    res.status(201).json({ accessToken: token });
  } catch (err) {
    console.error("Error while generating JWT Tokens:", err);
    return next(createHttpError(500, "Error while generating JWT Tokens."));
  }
};

export { createUser, loginUser };
