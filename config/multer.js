// import multer from "multer";
const multer = require("multer");
// import { CloudinaryStorage } from "multer-storage-cloudinary";
const { CloudinaryStorage } = require("multer-storage-cloudinary");
// import cloudinary from "./cloudinary";
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "posts",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
});

const upload = multer({ storage });
module.exports = { upload };
