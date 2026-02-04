// controllers/articleController.js (With proper validation)
const Article = require('../models/Article');
const { cloudinary } = require('../config/cloudinary');

// Helper function to validate Editor.js content
const validateEditorContent = (content) => {
    if (!content || typeof content !== 'object') {
        throw new Error('Content must be a valid Editor.js object');
    }

    if (!Array.isArray(content.blocks)) {
        throw new Error('Content must have a blocks array');
    }

    return true;
};

// @desc    Create new article
// @route   POST /api/articles
// @access  Private
exports.createArticle = async (req, res) => {
    try {
        const { title, content, coverImage, tags, category, status, metaDescription } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Title is required',
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required',
            });
        }

        // Validate Editor.js content structure
        try {
            validateEditorContent(content);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }

        // If coverImage is base64, upload to Cloudinary
        let coverImageUrl = coverImage;
        if (coverImage && coverImage.startsWith('data:image')) {
            const result = await cloudinary.uploader.upload(coverImage, {
                folder: 'blog/covers',
                transformation: [{ width: 1200, height: 630, crop: 'fill' }],
            });
            coverImageUrl = result.secure_url;
        }

        const article = await Article.create({
            title,
            content, // Store as-is (Mixed type handles it)
            coverImage: coverImageUrl,
            tags: tags || [],
            category,
            status: status || 'draft',
            metaDescription,
            author: req.user._id,
        });

        // Populate author
        await article.populate('author', 'name email avatar');

        res.status(201).json({
            success: true,
            data: article,
        });
    } catch (error) {
        console.error('Create article error: ', error);
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get all published articles
// @route   GET /api/articles
// @access  Public
exports.getArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, tag, category, search } = req.query;

        const query = { status: 'published' };

        // Filter by tag
        if (tag) {
            query.tags = tag;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Search by title
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const articles = await Article.find(query)
            .populate('author', 'name email avatar')
            .sort({ publishedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Article.countDocuments(query);

        // Convert to plain objects with virtuals
        const articlesWithVirtuals = articles.map(article => {
            const obj = article.toObject();
            return obj;
        });

        res.json({
            success: true,
            data: articlesWithVirtuals,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single article by slug
// @route   GET /api/articles/:slug
// @access  Public
exports.getArticle = async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug })
            .populate('author', 'name email avatar bio followers following articlesCount');

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // Increment views (in background, don't wait)
        Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).exec();

        res.json({
            success: true,
            data: article.toObject(), // Converts to plain object with virtuals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single article by ID (for editing)
// @route   GET /api/articles/id/:id
// @access  Private
exports.getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('author', 'name email avatar bio')
            .lean();

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // Check if user is the author (for security)
        if (article.author._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this article',
            });
        }

        res.json({
            success: true,
            data: article,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private
exports.updateArticle = async (req, res) => {
    try {
        let article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // Check if user is the author
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this article',
            });
        }

        // Validate content if provided
        if (req.body.content) {
            try {
                validateEditorContent(req.body.content);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        }

        const updateData = { ...req.body };

        // If new coverImage is base64, upload to Cloudinary
        if (req.body.coverImage && req.body.coverImage.startsWith('data:image')) {
            // Delete old image from Cloudinary if exists
            if (article.coverImage && article.coverImage.includes('cloudinary')) {
                const publicId = extractPublicId(article.coverImage);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId).catch(err => {
                        console.error('Failed to delete old image:', err);
                    });
                }
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(req.body.coverImage, {
                folder: 'blog/covers',
                transformation: [{ width: 1200, height: 630, crop: 'fill' }],
            });
            updateData.coverImage = result.secure_url;
        }

        article = await Article.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).populate('author', 'name email avatar');

        res.json({
            success: true,
            data: article,
        });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        // Check if user is the author
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this article',
            });
        }

        // Delete cover image from Cloudinary
        if (article.coverImage && article.coverImage.includes('cloudinary')) {
            const publicId = extractPublicId(article.coverImage);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId).catch((err) => {
                    console.error('Failed to delete cover image:', err);
                });
            }
        }

        // Delete images from content blocks
        if (article.content && article.content.blocks) {
            const imageBlocks = article.content.blocks.filter(
                (block) => block.type === 'image' && block.data && block.data.file
            );

            for (const block of imageBlocks) {
                if (block.data.file.url && block.data.file.url.includes('cloudinary')) {
                    const publicId = extractPublicId(block.data.file.url);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId).catch((err) => {
                            console.error('Failed to delete content image:', err);
                        });
                    }
                }
            }
        }

        await article.deleteOne();

        res.json({
            success: true,
            data: {},
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Like/Unlike article
// @route   PUT /api/articles/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        await article.toggleLike(req.user._id);

        res.json({
            success: true,
            data: {
                likesCount: article.likesCount,
                isLiked: article.likes.includes(req.user._id),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get user's articles (drafts + published)
// @route   GET /api/articles/me/articles
// @access  Private
exports.getMyArticles = async (req, res) => {
    try {
        const articles = await Article.find({ author: req.user._id })
            .sort({ createdAt: -1 });

        // Convert to plain objects with virtuals
        const articlesWithVirtuals = articles.map(article => article.toObject());
        // console.log("ArticlesWithVirtuals:", articlesWithVirtuals);

        res.json({
            success: true,
            data: articlesWithVirtuals,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get featured articles
// @route   GET /api/articles/featured
// @access  Public
exports.getFeaturedArticles = async (req, res) => {
    try {
        const articles = await Article.find({
            status: 'published',
            isFeatured: true,
        })
            .populate('author', 'name avatar')
            .sort({ publishedAt: -1 })
            .limit(5);

        // Convert to plain objects with virtuals
        const articlesWithVirtuals = articles.map(article => article.toObject());

        res.json({
            success: true,
            data: articlesWithVirtuals,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;

    try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/blog/covers/abc123.jpg
        const matches = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
        return matches ? matches[1] : null;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};