const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");

const articleRoutes = require("./routes/articleRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());
app.use(helmet());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));


// Routes
app.use("/api/articles", articleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});

// Error middleware
app.use(require("./middleware/errorMiddleware"));

module.exports = app;