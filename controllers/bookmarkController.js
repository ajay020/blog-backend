// controllers/bookmarkController.js
const Bookmark = require('../models/Bookmark');
const Article = require('../models/Article');

// @desc    Toggle bookmark (add/remove)
// @route   PUT /api/articles/:articleId/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const userId = req.user._id;

        // Check if article exists
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // Check if bookmark exists
        const existingBookmark = await Bookmark.findOne({
            user: userId,
            article: articleId,
        });

        if (existingBookmark) {
            // Remove bookmark
            await existingBookmark.deleteOne();

            return res.json({
                success: true,
                message: 'Bookmark removed',
                data: {
                    isBookmarked: false,
                },
            });
        } else {
            // Add bookmark
            await Bookmark.create({
                user: userId,
                article: articleId,
            });

            return res.json({
                success: true,
                message: 'Bookmark added',
                data: {
                    isBookmarked: true,
                },
            });
        }
    } catch (error) {
        console.error('Toggle bookmark error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get user's bookmarks
// @route   GET /api/bookmarks
// @access  Private
exports.getBookmarks = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user._id;

        const bookmarks = await Bookmark.find({ user: userId })
            .populate({
                path: 'article',
                populate: {
                    path: 'author',
                    select: 'name avatar',
                },
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Bookmark.countDocuments({ user: userId });

        // Filter out bookmarks where article was deleted
        const validBookmarks = bookmarks.filter(b => b.article !== null);

        // Extract articles
        const articles = validBookmarks.map(b => b.article.toObject());

        res.json({
            success: true,
            data: articles,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Check if article is bookmarked
// @route   GET /api/articles/:articleId/is-bookmarked
// @access  Private
exports.isBookmarked = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const userId = req.user._id;

        const bookmark = await Bookmark.findOne({
            user: userId,
            article: articleId,
        });

        res.json({
            success: true,
            data: {
                isBookmarked: !!bookmark,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Remove bookmark by ID
// @route   DELETE /api/bookmarks/:id
// @access  Private
exports.removeBookmark = async (req, res) => {
    try {
        const bookmarkId = req.params.id;
        const userId = req.user._id;

        const bookmark = await Bookmark.findOne({
            _id: bookmarkId,
            user: userId,
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                error: 'Bookmark not found',
            });
        }

        await bookmark.deleteOne();

        res.json({
            success: true,
            message: 'Bookmark removed',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};