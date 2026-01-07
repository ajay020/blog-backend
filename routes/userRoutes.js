const express = require('express');
const router = express.Router();
const {
    login,
    register,
    getMe,
    googleAuth,
    bookmarkPost,
    getBookMarkPosts
} = require('../contorllers/userController');
const protect = require('../middleware/authMiddleware');


router.post("/login", login);

router.post("/register", register);

router.post("/auth/google", googleAuth);

router.post("/bookmark-post", protect, bookmarkPost);

router.get("/get-bookmark-posts", protect, getBookMarkPosts);

router.post("/me", protect, getMe);

module.exports = router;