const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 failed login attempts per hour
    message: 'Too many login attempts, please try again in an hour'
});

module.exports = authLimiter