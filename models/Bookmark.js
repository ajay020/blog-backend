const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });

// Index for user's bookmarks query
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;