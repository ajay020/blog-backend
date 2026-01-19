// models/Article.js (FIXED for Editor.js)
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Article title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        coverImage: {
            type: String,
            default: null,
        },

        // Editor.js content - store as Mixed type to allow any structure
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        // Optional: Plain text excerpt for previews
        excerpt: {
            type: String,
            maxlength: [500, 'Excerpt cannot exceed 500 characters'],
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },

        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

        category: {
            type: String,
            trim: true,
        },

        // SEO fields
        metaDescription: {
            type: String,
            maxlength: [160, 'Meta description cannot exceed 160 characters'],
        },

        // Engagement metrics
        views: {
            type: Number,
            default: 0,
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Reading time in minutes
        readingTime: {
            type: Number,
            default: 0,
        },

        // Comments
        commentsCount: {
            type: Number,
            default: 0,
        },

        // Featured article
        isFeatured: {
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
articleSchema.index({ slug: 1 });
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ status: 1, publishedAt: -1 });

// Virtual for likes count
articleSchema.virtual('likesCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Pre-save middleware to generate slug
articleSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Add timestamp to ensure uniqueness
        this.slug = `${this.slug}-${Date.now()}`;
    }
    next();
});

// Pre-save middleware to calculate reading time
articleSchema.pre('save', function (next) {
    if (this.isModified('content') && this.content && this.content.blocks) {
        // Calculate word count from all text blocks
        let wordCount = 0;

        this.content.blocks.forEach((block) => {
            if (block.data && block.data.text) {
                // Remove HTML tags and count words
                const text = block.data.text.replace(/<[^>]*>/g, '');
                wordCount += text.split(/\s+/).filter(word => word.length > 0).length;
            }

            // Count words in list items (handles both string and object formats)
            if (block.type === 'list' && block.data && block.data.items) {
                block.data.items.forEach((item) => {
                    let text = '';

                    // Handle newer Editor.js format (item is an object with content property)
                    if (typeof item === 'object' && item.content) {
                        text = item.content;
                    }
                    // Handle older Editor.js format (item is a string)
                    else if (typeof item === 'string') {
                        text = item;
                    }

                    // Remove HTML tags and count words
                    if (text) {
                        text = text.replace(/<[^>]*>/g, '');
                        wordCount += text.split(/\s+/).filter(word => word.length > 0).length;
                    }
                });
            }
        });

        // Average reading speed: 200 words per minute
        this.readingTime = Math.ceil(wordCount / 200) || 1;
    }
    next();
});

// Pre-save middleware to auto-generate excerpt if not provided
articleSchema.pre('save', function (next) {
    if (this.isModified('content') && !this.excerpt && this.content && this.content.blocks) {
        // Find first paragraph block
        const firstParagraph = this.content.blocks.find(
            (block) => block.type === 'paragraph' && block.data && block.data.text
        );

        if (firstParagraph) {
            // Remove HTML tags and limit to 200 characters
            const text = firstParagraph.data.text.replace(/<[^>]*>/g, '');
            this.excerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '');
        } else {
            // If no paragraph, try to extract from first list item
            const firstList = this.content.blocks.find(
                (block) => block.type === 'list' && block.data && block.data.items && block.data.items.length > 0
            );

            if (firstList) {
                const firstItem = firstList.data.items[0];
                let text = '';

                // Handle both object and string formats
                if (typeof firstItem === 'object' && firstItem.content) {
                    text = firstItem.content;
                } else if (typeof firstItem === 'string') {
                    text = firstItem;
                }

                if (text) {
                    text = text.replace(/<[^>]*>/g, '');
                    this.excerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '');
                }
            }
        }
    }
    next();
});

// Pre-save middleware to set publishedAt date
articleSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Static method to find published articles
articleSchema.statics.findPublished = function () {
    return this.find({ status: 'published' }).sort({ publishedAt: -1 });
};

// Static method to find articles by tag
articleSchema.statics.findByTag = function (tag) {
    return this.find({ tags: tag, status: 'published' }).sort({ publishedAt: -1 });
};

// Instance method to increment views
articleSchema.methods.incrementViews = function () {
    this.views += 1;
    return this.save();
};

// Instance method to toggle like
articleSchema.methods.toggleLike = function (userId) {
    const index = this.likes.indexOf(userId);

    if (index === -1) {
        // Add like
        this.likes.push(userId);
    } else {
        // Remove like
        this.likes.splice(index, 1);
    }

    return this.save();
};

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;