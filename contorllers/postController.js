const path = require('path');
const fs = require('fs');
const Post = require('../models/postModel');
const upload = require('../middleware/uploadMiddleware');


const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      Post.find()
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
    res.status(500).json({
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};


const createPost = async (req, res) => {
    if (!req.body) {
        res.status(400).json({ message: "Please enter data" });
    }
    // console.log(req.body);
    try {
        const post = await Post.create(
            {
                user: req.user.id,
                username: req.user.name,
                title: req.body.title,
                content: req.body.content,
                imageUrl: req.file ? `images/${req.file.filename}` : ''
            });
        res.status(200).json(post);

    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

const updatePost = async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(401).json({ message: "Post not found" });
        }
        // check if post is created by current user
        if (post.user.toString() !== req.user._id.toString()) {
            console.log(post.user, req.user._id);
            return res.status(401).json({ message: "User not authorized" });
        }
        //update post
        const updatedPost = await Post.findByIdAndUpdate(postId, { ...req.body, imageUrl: req.file ? `images/${req.file.filename}` : '' }, { new: true });
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(400).json({ err: error.message });
    }
}

const deletePost = async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(400).json({ message: 'post not found' });
        }
        // check if post is created by current user
        if (post.user.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        if (post.imageUrl) {
            const filePath = 'public/' + post.imageUrl;
            fs.unlink(filePath, (err) => {
                if (err) return res.status(400).json({ err: err.message });
                console.log("File deleted successfully");
            })
        }


        await post.remove();
        return res.status(200).json({ id: postId });
    } catch (error) {
        return res.status(400).json({ err: error.message });
    }
}

const upvotePost = async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await Post.findById(postId);
        // console.log("before >>> ",post);
        if (!post) {
            return res.status(400).json({ message: "Post not found" });
        }

        // let x = await Post.findById(postId,{upvotes: {$elemMatch: { $eq: req.user._id } }})
        // console.log("dddd", post.upvotes.includes(req.user._id));

        if (post.upvotes.includes(req.user._id)) {
            await post.upvotes.pull(req.user._id);
            // console.log("yyyy", y);

        } else {
            await post.upvotes.push(req.user._id);
            // let updatedPost = await Post.findByIdAndUpdate(
            //     postId, 
            //     {$addToSet:{upvotes: req.user._id }}, 
            //     { upsert: true },
            // )
        }
        await post.save();
        // console.log(post);
        res.status(200).json(post);

    } catch (error) {
        res.status(400).json({ err: error.message });
    }
}



module.exports = {
    getPosts,
    createPost,
    updatePost,
    deletePost,
    upvotePost,
}