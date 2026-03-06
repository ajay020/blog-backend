const User = require('../models/User');
const Article = require('../models/Article');
const AppError = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');
const { extractPublicId } = require('../utils/helper');

// Register user
const registerUser = async ({ name, email, password }) => {
    const userExists = await User.findOne({ email });
    if (userExists) throw new AppError('User already exists with this email', 400);

    const user = await User.create({ name, email, password });
    return user;
};

// Login user
const loginUser = async ({ email, password }) => {
    if (!email || !password) throw new AppError('Please provide email and password', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid credentials', 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    return user;
};

// Get current logged in user
const getMe = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
};

// Update user details
const updateDetails = async (userId, updateData) => {
    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
    return user;
};

// Update password
const updatePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 401);

    user.password = newPassword;
    await user.save();

    return user;
};

// Delete account (user + articles + Cloudinary images)
const deleteAccount = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Delete user's avatar
    if (user.avatar?.includes('cloudinary')) {
        const publicId = extractPublicId(user.avatar);
        if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    // Delete all user's articles and associated images
    const userArticles = await Article.find({ author: userId });

    for (const article of userArticles) {
        // Cover image
        if (article.coverImage?.includes('cloudinary')) {
            const publicId = extractPublicId(article.coverImage);
            if (publicId) await cloudinary.uploader.destroy(publicId);
        }

        // Content images
        if (article.content?.blocks) {
            const imageBlocks = article.content.blocks.filter(b => b.type === 'image' && b.data?.file?.url);
            for (const block of imageBlocks) {
                if (block.data.file.url.includes('cloudinary')) {
                    const publicId = extractPublicId(block.data.file.url);
                    if (publicId) await cloudinary.uploader.destroy(publicId);
                }
            }
        }
    }

    await Article.deleteMany({ author: userId });
    await user.deleteOne();

    return true;
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateDetails,
    updatePassword,
    deleteAccount
};