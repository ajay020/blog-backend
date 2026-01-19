// routes/uploadRoutes.js
const express = require('express');
const {
    uploadImage,
    uploadImages,
    deleteImage,
    uploadBase64,
} = require('../contorllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All upload routes require authentication
router.use(protect);

// Upload single image (multipart/form-data)
router.post('/image', upload.single('image'), uploadImage);

// Upload multiple images (multipart/form-data)
router.post('/images', upload.array('images', 10), uploadImages);

// Upload base64 image (JSON)
router.post('/base64', uploadBase64);

// Delete image
router.delete('/image/:publicId', deleteImage);

module.exports = router;