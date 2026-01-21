// controllers/uploadController.js
const { cloudinary } = require('../config/cloudinary');

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        console.log("Req.File", req.file)

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload an image',
            });
        }

        // File is automatically uploaded to Cloudinary by multer
        // req.file.path contains the Cloudinary URL
        res.json({
            success: true,
            data: {
                url: req.file.path,
                publicId: req.file.filename,
            },
        });
    } catch (error) {
        console.log("Image load error : ", error.message)
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
exports.uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least one image',
            });
        }

        const images = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
        }));

        res.json({
            success: true,
            data: images,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private
exports.deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Upload base64 image
// @route   POST /api/upload/base64
// @access  Private
exports.uploadBase64 = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Please provide base64 image data',
            });
        }

        // Upload base64 image to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'blog',
            resource_type: 'auto',
        });

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};