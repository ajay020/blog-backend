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

const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

//@ get all posts
// GET /api/posts
//access public
router.get("/", getPosts);

//@ create new post
// POST /api/posts
//access private
router.post("/", protect, upload.single('image'), createPost)


//@ update post
// PATCH /api/posts
//access private
router.patch("/:postId", protect, upload.single('image'), updatePost);

//@ delete post
// Delete /api/posts
//access private
router.delete("/:postId", protect, deletePost)

//@ upvote post
// POST /api/posts
//access private
router.post("/upvote/:postId", protect, toggleUpvote);

//@ add comment
// POST /api/posts/:id/comments
// access private
router.post("/:id/comments", protect, addComment);

//@ delete comment
// DELETE /api/posts/:id/comments/:commentId
// access private
router.delete("/:postId/comments/:commentId", protect, deleteComment);


// @ update comment
// PUT /api/posts/:id/comments/:commentId
// access private
router.put("/:postId/comments/:commentId", protect, updateComment);

//@ get post by id
// GET /api/posts/:id
// access public
router.get("/:id", getPostById);


module.exports = router;