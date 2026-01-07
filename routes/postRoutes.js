const express  = require('express');
const { 
      getPosts,
      updatePost, 
      deletePost,
      createPost, 
      upvotePost,
      uploadImage} = require('../contorllers/postController');
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
router.post("/", protect,upload.single('image'), createPost)


//@ update post
// PATCH /api/posts
//access private
router.patch("/:postId",protect,upload.single('image'),  updatePost);

//@ delete post
// Delete /api/posts
//access private
router.delete("/:postId",protect,  deletePost)

//@ upvote post
// POST /api/posts
//access private
router.post("/upvote/:postId",protect, upvotePost)


module.exports = router ;