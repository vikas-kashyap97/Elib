import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  mongoUrl: process.env.MONGO_API_KEY,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  cloudinaryCloud: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApi: process.env.CLOUDINARY_API_KEY,
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET_KEY,
};

export const config = Object.freeze(_config);
