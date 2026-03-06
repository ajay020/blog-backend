const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === "development") {
        return res.status(statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack
        });
    }

    return res.status(statusCode).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
};

module.exports = errorMiddleware;