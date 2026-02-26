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
    // 1. Find parent comments and convert to plain objects immediately using .lean()
    // .lean() makes the query much faster because it returns JS objects, not Mongoose documents
    const comments = await this.find({
        article: articleId,
        parentComment: null,
        isDeleted: false,
    })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();

    // 2. Map through the plain objects and attach replies
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
        const replies = await this.find({
            parentComment: comment._id,
            isDeleted: false,
        })
            .populate('author', 'name avatar')
            .sort({ createdAt: 1 })
            .lean();

        // Now this will stay attached because 'comment' is a plain object
        return {
            ...comment,
            replies: replies,
            repliesCount: replies.length
        };
    }));

    return commentsWithReplies;
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