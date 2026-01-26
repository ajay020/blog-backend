// routes/commentRoutes.js
const express = require('express');
const {
    createComment,
    getComments,
    updateComment,
    deleteComment,
    toggleCommentLike,
} = require('../controllers/commentController');

const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getComments);

// Protected routes
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, toggleCommentLike);

module.exports = router;