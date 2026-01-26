// controllers/commentController.js
const Comment = require('../models/Comment');
const Article = require('../models/Article');

// @desc    Create a comment
// @route   POST /api/articles/:articleId/comments
// @access  Private
exports.createComment = async (req, res) => {
    try {
        const { content, parentComment } = req.body;
        const articleId = req.params.articleId;

        // Check if article exists
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // If replying to a comment, check if parent comment exists
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent) {
                return res.status(404).json({
                    success: false,
                    error: 'Parent comment not found',
                });
            }
        }

        const comment = await Comment.create({
            content,
            article: articleId,
            author: req.user._id,
            parentComment: parentComment || null,
        });

        await comment.populate('author', 'name avatar');

        res.status(201).json({
            success: true,
            data: comment.toObject(),
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get comments for an article
// @route   GET /api/articles/:articleId/comments
// @access  Public
exports.getComments = async (req, res) => {
    try {
        const articleId = req.params.articleId;

        const comments = await Comment.getCommentsWithReplies(articleId);

        res.json({
            success: true,
            data: comments,
            count: comments.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        let comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found',
            });
        }

        // Check if user is the comment author
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this comment',
            });
        }

        comment.content = content;
        await comment.save();
        await comment.populate('author', 'name avatar');

        res.json({
            success: true,
            data: comment.toObject(),
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        console.log("DELETE comment", req.params.id)
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found',
            });
        }

        // Check if user is the comment author or article author
        const article = await Article.findById(comment.article);
        const isCommentAuthor = comment.author.toString() === req.user._id.toString();
        const isArticleAuthor = article.author.toString() === req.user._id.toString();

        if (!isCommentAuthor && !isArticleAuthor) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this comment',
            });
        }

        // Soft delete - mark as deleted instead of removing
        comment.isDeleted = true;
        comment.content = '[Comment deleted]';
        await comment.save();

        res.json({
            success: true,
            data: {},
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Like/Unlike a comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.toggleCommentLike = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found',
            });
        }

        const userId = req.user._id;
        const index = comment.likes.indexOf(userId);

        if (index === -1) {
            // Add like
            comment.likes.push(userId);
        } else {
            // Remove like
            comment.likes.splice(index, 1);
        }

        await comment.save();

        res.json({
            success: true,
            data: {
                likesCount: comment.likesCount,
                isLiked: comment.likes.includes(userId),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};