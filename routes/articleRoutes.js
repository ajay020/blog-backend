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

// Assuming you have auth middleware
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getArticles);
router.get('/featured', getFeaturedArticles);
router.get('/:slug', getArticle);

// Protected routes
router.use(protect); // All routes after this require authentication

router.post('/', createArticle);
router.get('/me/articles', getMyArticles);
router.get('/id/:id', getArticleById);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);
router.put('/:id/like', toggleLike);

module.exports = router;