const User = require('../models/User');
const Article = require('../models/Article');
const AppError = require('../utils/AppError');

exports.followUser = async (targetUserId, currentUserId) => {
    if (targetUserId === currentUserId.toString()) {
        throw new AppError('You cannot follow yourself', 400);
    }

    const userToFollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) throw new AppError('User not found', 404);

    if (currentUser.following.includes(targetUserId)) {
        throw new AppError('You are already following this user', 400);
    }

    currentUser.following.push(targetUserId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    return {
        followingCount: currentUser.following.length,
        followersCount: userToFollow.followers.length
    };
};

exports.unfollowUser = async (targetUserId, currentUserId) => {
    const userToUnfollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) throw new AppError('User not found', 404);

    if (!currentUser.following.includes(targetUserId)) {
        throw new AppError('You are not following this user', 400);
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId.toString());

    await currentUser.save();
    await userToUnfollow.save();

    return {
        followingCount: currentUser.following.length,
        followersCount: userToUnfollow.followers.length
    };
};

exports.getUserProfile = async (targetUserId) => {
    const user = await User.findById(targetUserId).select('-password').lean();
    if (!user) throw new AppError('User not found', 404);

    const articlesCount = await Article.countDocuments({
        author: targetUserId,
        status: 'published'
    });

    return { ...user, articlesCount };
};

exports.getConnections = async (userId, type) => {
    const user = await User.findById(userId).populate(type, 'name email avatar bio').lean();
    if (!user) throw new AppError('User not found', 404);
    return user[type];
};

exports.isFollowing = async (userId) => {
    const currentUser = await User.findById(userId).lean();
    const isFollowing = currentUser.following.some(
        (id) => id.toString() === userId
    );

    return {
        isFollowing
    }
};