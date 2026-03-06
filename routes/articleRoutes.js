const express = require('express');
const articleController = require('../controllers/articleController');
const {
    toggleBookmark,
    isBookmarked,
} = require('../controllers/bookmarkController');

const commentRoutes = require('./commentRoutes');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', articleController.getArticles);
router.get('/featured', articleController.getFeaturedArticles);
router.get('/:slug', articleController.getArticleBySlug);

// Nested comment routes
router.use('/:articleId/comments', commentRoutes);

// Protected routes
router.use(protect); // All routes after this require authentication

router.post('/', articleController.createArticle);
router.get('/me/articles', articleController.getMyArticles);
router.get('/id/:id', articleController.getArticleById);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.put('/:id/like', articleController.toggleLike);

// Bookmark routes
router.put('/:articleId/bookmark', toggleBookmark);
router.get('/:articleId/is-bookmarked', isBookmarked);

module.exports = router;