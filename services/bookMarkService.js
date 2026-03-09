const Bookmark = require("../models/Bookmark");
const Article = require("../models/Article");
const AppError = require("../utils/AppError");

// Toggle bookmark
exports.toggleBookmark = async (articleId, userId) => {

    const article = await Article.findById(articleId);
    if (!article) {
        throw new AppError("Article not found", 404);
    }

    const existingBookmark = await Bookmark.findOne({
        user: userId,
        article: articleId,
    });

    if (existingBookmark) {
        await existingBookmark.deleteOne();

        return {
            message: "Bookmark removed",
            data: { isBookmarked: false },
        };
    }

    await Bookmark.create({
        user: userId,
        article: articleId,
    });

    return {
        message: "Bookmark added",
        data: { isBookmarked: true },
    };
};


// Get bookmarks
exports.getBookmarks = async (userId, page = 1, limit = 10) => {

    page = parseInt(page);
    limit = parseInt(limit);

    const bookmarks = await Bookmark.find({ user: userId })
        .populate({
            path: "article",
            populate: {
                path: "author",
                select: "name avatar",
            },
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const articles = bookmarks
        .filter(b => b.article)
        .map(b => b.article.toObject());

    const total = await Bookmark.countDocuments({ user: userId });

    return {
        articles,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
    };
};


// Check if bookmarked
exports.isBookmarked = async (articleId, userId) => {

    const bookmark = await Bookmark.findOne({
        user: userId,
        article: articleId,
    });

    return {
        isBookmarked: !!bookmark,
    };
};


// Remove bookmark
exports.removeBookmark = async (bookmarkId, userId) => {

    const bookmark = await Bookmark.findOne({
        _id: bookmarkId,
        user: userId,
    });

    if (!bookmark) {
        throw new AppError("Bookmark not found", 404);
    }

    await bookmark.deleteOne();

    return {
        message: "Bookmark removed",
    };
};