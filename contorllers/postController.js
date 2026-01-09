const path = require('path');
const fs = require('fs');
const Post = require('../models/postModel');
const upload = require('../middleware/uploadMiddleware');

// Get all posts with pagination
const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [posts, totalPosts] = await Promise.all([
            Post.find()
                .populate("author", "name")
                .populate("comments.user", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(),
        ]);

        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            posts,
            page,
            totalPages,
            hasMore: page < totalPages,
        });
    } catch (error) {
        console.error("Get Posts Error:", error);
        res.status(500).json({
            message: "Server error",
            success: false,
        });
    }
};

// Get a single post by ID
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name")
            .populate("comments.user", "name");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Get Post Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const createPost = async (req, res) => {
    try {
        const { title, content, image } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const post = await Post.create({
            author: req.user.id,
            title,
            content,
            image, // { url, publicId }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { title, content, image } = req.body;

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (image !== undefined) post.image = image;

        const updatedPost = await post.save();

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Update Post Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await post.deleteOne();

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete Post Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const toggleUpvote = async (req, res) => {
    try {
        console.log("Toggle upvote for postId:", req.params.postId);

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userId = req.user.id;
        const alreadyUpvoted = post.upvotes.includes(userId);

        if (alreadyUpvoted) {
            post.upvotes.pull(userId);
        } else {
            post.upvotes.push(userId);
        }

        await post.save();

        res.status(200).json({
            upvotesCount: post.upvotes.length,
            upvoted: !alreadyUpvoted,
        });
    } catch (error) {
        console.error("Upvote Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const addComment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Comment text required" });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = {
            user: req.user.id,
            text,
        };

        post.comments.push(comment);
        const updatedPost = await post.save();
        const newComment = updatedPost.comments[updatedPost.comments.length - 1];

        res.status(201).json(newComment);
    } catch (error) {
        console.error("Add Comment Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        comment.remove();
        await post.save();

        res.status(200).json({ message: "Comment deleted" });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// update comment
const updateComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { text } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        comment.text = text;
        await post.save();

        res.status(200).json(comment);
    } catch (error) {
        console.error("Update Comment Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}


module.exports = {
    getPosts,
    createPost,
    updatePost,
    deletePost,
    toggleUpvote,
    addComment,
    deleteComment,
    updateComment,
    getPostById,
}