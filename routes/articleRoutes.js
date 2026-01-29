const express = require('express');
const {
    createArticle,
    getArticles,
    getArticle,
    updateArticle,
    deleteArticle,
    toggleLike,
    getMyArticles,
    getArticleById,
    getFeaturedArticles,
} = require('../controllers/articleController');

const {
    toggleBookmark,
    isBookmarked,
} = require('../controllers/bookmarkController');

// Import comment routes
const commentRoutes = require('./commentRoutes');

// Assuming you have auth middleware
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getArticles);
router.get('/featured', getFeaturedArticles);
router.get('/:slug', getArticle);

// Nested comment routes
router.use('/:articleId/comments', commentRoutes);

// Protected routes
router.use(protect); // All routes after this require authentication

router.post('/', createArticle);
router.get('/me/articles', getMyArticles);
router.get('/id/:id', getArticleById); //  Get article by ID for editing
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);
router.put('/:id/like', toggleLike);

// Bookmark routes
router.put('/:articleId/bookmark', toggleBookmark);
router.get('/:articleId/is-bookmarked', isBookmarked);

module.exports = router;