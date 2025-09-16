import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";

cloudinary.config({
  cloud_name: config.cloudinaryCloud as string,
  api_key: config.cloudinaryApi as string,
  api_secret: config.cloudinarySecret as string,
});

export default cloudinary;
