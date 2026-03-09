const asyncHandler = require("../utils/asyncHandler")
const followService = require("../services/followService")

// @route   PUT /api/users/:userId/follow
exports.followUser = asyncHandler(async (req, res) => {
    const counts = await followService.followUser(req.params.userId, req.user._id);
    res.status(200).json({
        success: true,
        message: 'User followed successfully',
        data: counts
    });
});

// @route   PUT /api/users/:userId/unfollow
exports.unfollowUser = asyncHandler(async (req, res) => {
    const counts = await followService.unfollowUser(req.params.userId, req.user._id);
    res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        data: counts
    });
});

// @route   GET /api/users/:userId/followers
exports.getFollowers = asyncHandler(async (req, res) => {
    const followers = await followService.getConnections(req.params.userId, 'followers');
    res.status(200).json({ success: true, count: followers.length, data: followers });
});

// @route   GET /api/users/:userId/following
exports.getFollowing = asyncHandler(async (req, res) => {
    const following = await followService.getConnections(req.params.userId, 'following');
    res.status(200).json({ success: true, count: following.length, data: following });
});

// @route   GET /api/users/:userId/is-following
exports.isFollowing = asyncHandler(async (req, res) => {
    const result = followService.isFollowing(req.params.userId)

    res.json({
        success: true,
        data: {
            isFollowing: result.isFollowing
        },
    });
});

// @route   GET /api/users/:userId
exports.getUserById = asyncHandler(async (req, res) => {
    const profile = await followService.getUserProfile(req.params.userId);
    res.status(200).json({ success: true, data: profile });
});