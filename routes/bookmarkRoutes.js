// routes/bookmarkRoutes.js
const express = require('express');
const {
    toggleBookmark,
    getBookmarks,
    isBookmarked,
    removeBookmark,
} = require('../controllers/bookmarkController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All bookmark routes require authentication
router.use(protect);

router.get('/', getBookmarks);
router.delete('/:id', removeBookmark);
router.put('/:id/bookmark', toggleBookmark);
router.get('/:id/is-bookmarked', isBookmarked);

module.exports = router;