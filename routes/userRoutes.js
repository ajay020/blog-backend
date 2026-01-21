const express = require('express');
const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    isFollowing,
    getUserById,
} = require('../controllers/followController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:userId', getUserById);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Protected routes
router.put('/:userId/follow', protect, followUser);
router.put('/:userId/unfollow', protect, unfollowUser);
router.get('/:userId/is-following', protect, isFollowing);

module.exports = router;