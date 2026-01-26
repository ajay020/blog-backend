const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },

        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            required: true,
            index: true,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // For nested comments (replies)
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },

        // Likes on comments
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Flag for moderation
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for likes count
commentSchema.virtual('likesCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Virtual for replies count
commentSchema.virtual('repliesCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment',
    count: true,
});

// Static method to get comments with replies
commentSchema.statics.getCommentsWithReplies = async function (articleId) {
    const comments = await this.find({
        article: articleId,
        parentComment: null,
        isDeleted: false,
    })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 });

    // Get replies for each comment
    for (let comment of comments) {
        const replies = await this.find({
            parentComment: comment._id,
            isDeleted: false,
        })
            .populate('author', 'name avatar')
            .sort({ createdAt: 1 });

        comment.replies = replies.map(r => r.toObject());
    }

    return comments.map(c => c.toObject());
};

// Update article's comment count after save
commentSchema.post('save', async function () {
    const Article = mongoose.model('Article');
    const count = await this.constructor.countDocuments({
        article: this.article,
        isDeleted: false,
    });

    await Article.findByIdAndUpdate(this.article, {
        commentsCount: count,
    });
});

// Update article's comment count after delete
commentSchema.post('deleteOne', { document: true }, async function () {
    const Article = mongoose.model('Article');
    const count = await this.constructor.countDocuments({
        article: this.article,
        isDeleted: false,
    });

    await Article.findByIdAndUpdate(this.article, {
        commentsCount: count,
    });
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;