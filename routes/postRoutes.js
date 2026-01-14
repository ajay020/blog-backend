const express = require('express');
const {
      getPosts,
      updatePost,
      deletePost,
      createPost,
      toggleUpvote,
      addComment,
      deleteComment,
      getPostById,
      updateComment
} = require('../contorllers/postController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../config/multer');

const router = express.Router();

//@ get all posts
// GET /api/posts
router.get("/", getPosts);

//@ create new post
// POST /api/posts
router.post("/", protect, upload.single("image"), createPost)


//@ update post
// PATCH /api/posts
router.patch("/:postId", protect, upload.single('image'), updatePost);

//@ delete post
// Delete /api/posts
router.delete("/:postId", protect, deletePost)

//@ upvote post
// POST /api/posts
router.post("/upvote/:postId", protect, toggleUpvote);

//@ add comment
// POST /api/posts/:id/comments
router.post("/:id/comments", protect, addComment);

//@ delete comment
// DELETE /api/posts/:id/comments/:commentId
router.delete("/:postId/comments/:commentId", protect, deleteComment);


// @ update comment
// PUT /api/posts/:id/comments/:commentId
router.put("/:postId/comments/:commentId", protect, updateComment);

//@ get post by id
// GET /api/posts/:id
router.get("/:id", getPostById);


module.exports = router;