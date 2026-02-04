const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Load env variables
dotenv.config();

// Import routes
const articleRoutes = require('./routes/articleRoutes');
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require("./routes/commentRoutes")
const bookmarkRoutes = require('./routes/bookmarkRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());


// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error:', err));


// Logging middleware
app.use(morgan("dev"));

// Routes
app.use('/api/articles', articleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/bookmarks", bookmarkRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Multer error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB',
        });
    }

    if (err.message === 'Not an image! Please upload an image.') {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    res.status(500).json({
        success: false,
        error: err.message || 'Server Error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;