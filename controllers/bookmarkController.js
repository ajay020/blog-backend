const asyncHandler = require('../utils/asyncHandler');
const bookmarkService = require("../services/bookMarkService");

// PUT /api/articles/:articleId/bookmark
exports.toggleBookmark = asyncHandler(async (req, res) => {

    const result = await bookmarkService.toggleBookmark(
        req.params.articleId,
        req.user._id
    );

    res.json({
        success: true,
        message: result.message,
        data: result.data,
    });
});


// GET /api/bookmarks
exports.getBookmarks = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10 } = req.query;

    const result = await bookmarkService.getBookmarks(
        req.user._id,
        page,
        limit
    );

    res.json({
        success: true,
        data: result.articles,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        total: result.total,
    });
});

// GET /api/articles/:articleId/is-bookmarked
exports.isBookmarked = asyncHandler(async (req, res) => {

    const result = await bookmarkService.isBookmarked(
        req.params.articleId,
        req.user._id
    );

    res.json({
        success: true,
        data: result,
    });
});

// DELETE /api/bookmarks/:id
exports.removeBookmark = asyncHandler(async (req, res) => {

    const result = await bookmarkService.removeBookmark(
        req.params.id,
        req.user._id
    );

    res.json({
        success: true,
        message: result.message,
    });
});