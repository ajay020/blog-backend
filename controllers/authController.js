const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
        });

        // Generate token and send response
        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }

        // Generate token and send response
        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            bio: req.body.bio,
            avatar: req.body.avatar,
            website: req.body.website,
            twitter: req.body.twitter,
            github: req.body.github,
            linkedin: req.body.linkedin,
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(
            (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password',
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    res.json({
        success: true,
        data: {},
        message: 'Logged out successfully',
    });
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Delete user's avatar from Cloudinary if exists
        if (user.avatar && user.avatar.includes('cloudinary')) {
            const publicId = extractPublicId(user.avatar);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId).catch((err) => {
                    console.error('Failed to delete avatar:', err);
                });
            }
        }

        // Find all user's articles
        const Article = require('../models/Article');
        const userArticles = await Article.find({ author: userId });

        // Delete all images from user's articles
        for (const article of userArticles) {
            // Delete cover image
            if (article.coverImage && article.coverImage.includes('cloudinary')) {
                const publicId = extractPublicId(article.coverImage);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId).catch((err) => {
                        console.error('Failed to delete cover image:', err);
                    });
                }
            }

            // Delete content images
            if (article.content && article.content.blocks) {
                const imageBlocks = article.content.blocks.filter(
                    (block) => block.type === 'image' && block.data && block.data.file
                );

                for (const block of imageBlocks) {
                    if (block.data.file.url && block.data.file.url.includes('cloudinary')) {
                        const publicId = extractPublicId(block.data.file.url);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId).catch((err) => {
                                console.error('Failed to delete content image:', err);
                            });
                        }
                    }
                }
            }
        }

        // Delete all user's articles
        await Article.deleteMany({ author: userId });

        // Delete user
        await user.deleteOne();

        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;

    try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/blog/covers/abc123.jpg
        const matches = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
        return matches ? matches[1] : null;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    // Set secure flag in production (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
        },
    });
};