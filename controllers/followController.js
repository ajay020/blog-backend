const User = require('../models/User');

// @desc    Follow a user
// @route   PUT /api/users/:userId/follow
// @access  Private
exports.followUser = async (req, res) => {
    try {
        const userToFollowId = req.params.userId;
        const currentUserId = req.user._id;

        // Check if trying to follow self
        if (userToFollowId === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                error: 'You cannot follow yourself',
            });
        }

        // Find both users
        const userToFollow = await User.findById(userToFollowId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Check if already following
        if (currentUser.following.includes(userToFollowId)) {
            return res.status(400).json({
                success: false,
                error: 'You are already following this user',
            });
        }

        // Add to following and followers arrays
        currentUser.following.push(userToFollowId);
        userToFollow.followers.push(currentUserId);

        await currentUser.save();
        await userToFollow.save();

        res.json({
            success: true,
            message: 'User followed successfully',
            data: {
                followingCount: currentUser.followingCount,
                followersCount: userToFollow.followersCount,
            },
        });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Unfollow a user
// @route   PUT /api/users/:userId/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
    try {
        const userToUnfollowId = req.params.userId;
        const currentUserId = req.user._id;

        // Find both users
        const userToUnfollow = await User.findById(userToUnfollowId);
        const currentUser = await User.findById(currentUserId);

        if (!userToUnfollow) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Check if not following
        if (!currentUser.following.includes(userToUnfollowId)) {
            return res.status(400).json({
                success: false,
                error: 'You are not following this user',
            });
        }

        // Remove from following and followers arrays
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userToUnfollowId
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUserId.toString()
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.json({
            success: true,
            message: 'User unfollowed successfully',
            data: {
                followingCount: currentUser.followingCount,
                followersCount: userToUnfollow.followersCount,
            },
        });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Public
exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'name email avatar bio')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            data: user.followers,
            count: user.followers.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Public
exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('following', 'name email avatar bio')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            data: user.following,
            count: user.following.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Check if current user follows another user
// @route   GET /api/users/:userId/is-following
// @access  Private
exports.isFollowing = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).lean();
        const isFollowing = currentUser.following.some(
            (id) => id.toString() === req.params.userId
        );

        res.json({
            success: true,
            data: {
                isFollowing,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:userId
// @access  Public
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Get user's article count
        const Article = require('../models/Article');
        const articlesCount = await Article.countDocuments({
            author: req.params.userId,
            status: 'published',
        });

        res.json({
            success: true,
            data: {
                ...user,
                articlesCount,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};