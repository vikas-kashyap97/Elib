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

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // validation
  if (!email || !password) {
    const error = createHttpError(400, "Email and password are required");
    return next(error);
  }

  // find user
  let user: User | null;
  try {
    user = await userModel.findOne({ email });
    if (!user) {
      const error = createHttpError(401, "Invalid email or password");
      return next(error);
    }
  } catch (err) {
    console.error("Error while finding user during login:", err);
    return next(createHttpError(500, "Error while logging in."));
  }

  // compare password
  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = createHttpError(401, "Invalid email or password");
      return next(error);
    }
  } catch (err) {
    console.error("Error while comparing password:", err);
    return next(createHttpError(500, "Error while verifying credentials."));
  }

  // generate token
  try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.status(201).json({ accessToken: token });
  } catch (err) {
    console.error("Error while generating JWT token:", err);
    return next(createHttpError(500, "Error while generating token."));
  }
};

export { createUser, loginUser };
