const Article = require('../models/Article');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const articleService = require("../services/articleService");

// POST /api/articles
const createArticle = asyncHandler(async (req, res) => {
    const article = await articleService.createArticle({
        ...req.body,
        authorId: req.user._id
    });

    res.status(201).json({ success: true, data: article });
});

// GET /api/articles
const getArticles = asyncHandler(async (req, res) => {
    const data = await articleService.getArticles(req.query);
    res.json({ success: true, ...data });
});

// GET /api/articles/:slug
const getArticleBySlug = asyncHandler(async (req, res) => {
    const article = await articleService.getArticleBySlug(req.params.slug);
    res.json({ success: true, data: article });
});

// GET /api/articles/id/:id
const getArticleById = asyncHandler(async (req, res) => {
    const article = await articleService.getArticleById(
        req.params.id,
        req.user._id
    );

    res.status(200).json({
        success: true,
        data: article
    });
});

// DELETE /api/articles/:id
const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) throw new AppError('Article not found', 404);

    await articleService.deleteArticle(article, req.user._id);

    res.json({ success: true, data: {} });
});

// PUT /api/articles/:id
const updateArticle = asyncHandler(async (req, res) => {
    const updatedArticle = await articleService.updateArticle(
        req.params.id,
        req.user._id,
        req.body
    );

    res.json({ success: true, data: updatedArticle });
});

// PUT /api/articles/:id/like
const toggleLike = asyncHandler(async (req, res) => {
    const data = await articleService.toggleLike(req.params.id, req.user._id);
    res.json({ success: true, data });
});

// GET /api/articles/me/articles
const getMyArticles = asyncHandler(async (req, res) => {
    const articles = await articleService.getMyArticles(req.user._id);
    res.json({ success: true, data: articles });
});

// GET /api/articles/featured
const getFeaturedArticles = asyncHandler(async (req, res) => {
    const articles = await articleService.getFeaturedArticles();
    res.json({ success: true, data: articles });
});

module.exports = {
    createArticle,
    getArticles,
    getArticleBySlug,
    getArticleById,
    deleteArticle,
    updateArticle,
    toggleLike,
    getMyArticles,
    getFeaturedArticles
};