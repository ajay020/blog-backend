const commentService = require("../services/commentService")
const asyncHandler = require("../utils/asyncHandler")

//POST /api/articles/:articleId/comments
exports.createComment = asyncHandler(async (req, res) => {
    const comment = await commentService.addComment({
        content: req.body.content,
        articleId: req.params.articleId,
        parentCommentId: req.body.parentComment
    }, req.user._id);

    res.status(201).json({ success: true, data: comment });
});

//GET /api/articles/:articleId/comments
exports.getComments = asyncHandler(async (req, res) => {
    const comments = await commentService.getArticleComments(req.params.articleId);
    res.status(200).json({ success: true, count: comments.length, data: comments });
});

//PUT /api/comments/:id
exports.updateComment = asyncHandler(async (req, res) => {
    const comment = await commentService.updateComment(
        req.params.id,
        req.user._id,
        req.body.content
    );
    res.status(200).json({ success: true, data: comment });
});

//DELETE /api/comments/:id
exports.deleteComment = asyncHandler(async (req, res) => {
    await commentService.deleteComment(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: {} });
});

//PUT /api/comments/:id/like
exports.toggleCommentLike = asyncHandler(async (req, res) => {
    const result = await commentService.toggleLike(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: result });
});