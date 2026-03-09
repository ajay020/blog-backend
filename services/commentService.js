const Comment = require('../models/Comment');
const Article = require('../models/Article');
const AppError = require('../utils/AppError');

exports.addComment = async (commentData, userId) => {
    const { content, articleId, parentCommentId } = commentData;

    // 1. Check article
    const article = await Article.findById(articleId);
    if (!article) throw new AppError('Article not found', 404);

    // 2. Check parent if it's a reply
    if (parentCommentId) {
        const parent = await Comment.findById(parentCommentId);
        if (!parent) throw new AppError('Parent comment not found', 404);
    }

    const comment = await Comment.create({
        content,
        article: articleId,
        author: userId,
        parentComment: parentCommentId || null,
    });

    return await comment.populate('author', 'name avatar');
};

exports.getArticleComments = async (articleId) => {
    return await Comment.getCommentsWithReplies(articleId);
};

exports.updateComment = async (commentId, userId, content) => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    // Authorization check
    if (comment.author.toString() !== userId.toString()) {
        throw new AppError('Not authorized to update this comment', 403);
    }

    comment.content = content;
    await comment.save();
    return await comment.populate('author', 'name avatar');
};

exports.deleteComment = async (commentId, userId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    const article = await Article.findById(comment.article);
    const isCommentAuthor = comment.author.toString() === userId.toString();
    const isArticleAuthor = article.author.toString() === userId.toString();

    if (!isCommentAuthor && !isArticleAuthor) {
        throw new AppError('Not authorized to delete this comment', 403);
    }

    // Soft delete logic
    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();
    return true;
};

exports.toggleLike = async (commentId, userId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    const index = comment.likes.indexOf(userId);
    if (index === -1) {
        comment.likes.push(userId);
    } else {
        comment.likes.splice(index, 1);
    }

    await comment.save();
    return {
        likesCount: comment.likes.length,
        isLiked: comment.likes.includes(userId)
    };
};