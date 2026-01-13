const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Post = require('../models/postModel');
const mongoose = require('mongoose');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

const googleAuth = async (req, res) => {
    const { googleTokenId } = req.body;

    const ticket = await client.verifyIdToken({
        idToken: googleTokenId,
        audience: process.env.CLIENT_ID
    })

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email }).select('-password');
    if (!user) {
        user = await User.create({ name, email });
    }
    // console.log(">>>>",user._doc);
    res.json({ ...user._doc, token: googleTokenId });
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 2. Find user (explicitly include password)
        const user = await User.findOne({ email })
            .select("+password")
            .populate("bookmarkedPosts", "title");

        // 3. Invalid credentials (same message for security)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Success response
        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                bookmarkedPosts: user.bookmarkedPosts,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // 2. Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // 3. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // 4. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // 6. Send response
        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


const getMe = async (req, res) => {
    try {
        const { _id, name, email } = await User.findById(req.user.id);

        return res.status(201).json({
            success: true,
            data: {
                id: _id,
                name,
                email
            }
        })
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

const bookmarkPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const user = await User.findById(userId);

        const alreadyBookmarked = user.bookmarkedPosts.some(
            (id) => id.toString() === postId
        );

        if (alreadyBookmarked) {
            // 🔴 Remove bookmark
            user.bookmarkedPosts = user.bookmarkedPosts.filter(
                (id) => id.toString() !== postId
            );
        } else {
            // 🟢 Add bookmark
            user.bookmarkedPosts.push(postId);
        }

        await user.save();

        res.status(200).json({
            postId,
            bookmarked: !alreadyBookmarked,
            message: alreadyBookmarked
                ? "Bookmark removed"
                : "Post bookmarked",
        });
    } catch (error) {
        console.error("Bookmark error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getBookMarkPosts = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate({
                path: "bookmarkedPosts",
                select: "title author createdAt",
                populate: {
                    path: "author",
                    select: "name",
                },
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.bookmarkedPosts);
    } catch (error) {
        console.error("Get bookmarks error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "30d" });
}

module.exports = {
    login,
    register,
    googleAuth,
    getMe,
    bookmarkPost,
    getBookMarkPosts
}