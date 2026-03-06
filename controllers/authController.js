const asyncHandler = require('../util/asyncHandler');
const authService = require('../services/authService');

// Helper: send token in cookie
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') options.secure = true;

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        }
    });
};

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.body);
    sendTokenResponse(user, 201, res);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
    const user = await authService.loginUser(req.body);
    sendTokenResponse(user, 200, res);
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user._id);
    res.json({ success: true, data: user });
});

// PUT /api/auth/updatedetails
exports.updateDetails = asyncHandler(async (req, res) => {
    const user = await authService.updateDetails(req.user._id, req.body);
    res.json({ success: true, data: user });
});

// PUT /api/auth/updatepassword
exports.updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await authService.updatePassword(req.user._id, currentPassword, newPassword);
    sendTokenResponse(user, 200, res);
});

// GET /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
    res.json({ success: true, data: {}, message: 'Logged out successfully' });
});

// DELETE /api/auth/account
exports.deleteAccount = asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
});