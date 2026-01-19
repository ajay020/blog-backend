const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - check if user is authenticated
exports.protect = async (req, res, next) => {
    let token;

    // Check if token exists in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Get token from Bearer token
        token = req.headers.authorization.split(' ')[1];
    }
    // Alternative: Check if token exists in cookies (if using cookies)
    // else if (req.cookies.token) {
    //   token = req.cookies.token;
    // }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route. Please login.',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token (exclude password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Please login again.',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized. Invalid token.',
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};

// Optional: Check if user is verified
exports.isVerified = (req, res, next) => {
    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            error: 'Please verify your email to access this resource',
        });
    }
    next();
};