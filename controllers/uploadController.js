const { cloudinary } = require('../config/cloudinary');
const asyncHandler = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")

//  POST /api/upload/image
exports.uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return new AppError('Please upload an image', 400)
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

});

//  POST /api/upload/images
exports.uploadImages = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return new AppError('Please upload at least one image', 400)
    }

    const images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
    }));

    res.json({
        success: true,
        data: images,
    });
});

// DELETE /api/upload/image/:publicId
exports.deleteImage = asyncHandler(async (req, res) => {
    const { publicId } = req.params;

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    res.json({
        success: true,
        message: 'Image deleted successfully',
    });
});