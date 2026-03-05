const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            error: "File size too large. Maximum size is 5MB",
        });
    }

    if (err.message === "Not an image! Please upload an image.") {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    res.status(500).json({
        success: false,
        error: err.message || "Server Error",
    });
};

module.exports = errorMiddleware;