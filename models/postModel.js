const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: [true, "Please add title"],
            trim: true,
            maxlength: 150,
        },

        content: {
            type: String,
            trim: true,
        },

        image: {
            url: {
                type: String,
            },
            publicId: {
                type: String,
            },
        },

        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        comments: [commentSchema],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Post", postSchema);
