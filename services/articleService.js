const Article = require("../models/Article");
const AppError = require("../utils/AppError");
const Article = require('../models/Article');
const AppError = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');


// Validate Editor.js content
const validateEditorContent = (content) => {
    if (!content || typeof content !== 'object') {
        throw new AppError('Content must be a valid Editor.js object', 400);
    }
    if (!Array.isArray(content.blocks)) {
        throw new AppError('Content must have a blocks array', 400);
    }
    return true;
};

// Extract Cloudinary public ID
const extractPublicId = (url) => {
    if (!url) return null;
    try {
        const matches = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
        return matches ? matches[1] : null;
    } catch {
        return null;
    }
};

// Upload image to Cloudinary
const uploadImage = async (imageBase64, folder) => {
    const result = await cloudinary.uploader.upload(imageBase64, {
        folder,
        transformation: [{ width: 1200, height: 630, crop: 'fill' }],
    });
    return result.secure_url;
};

// Service: Create Article
const createArticle = async ({ title, content, coverImage, tags, category, status, metaDescription, authorId }) => {
    if (!title) throw new AppError('Title is required', 400);
    if (!content) throw new AppError('Content is required', 400);

    validateEditorContent(content);

    let coverImageUrl = coverImage;
    if (coverImage && coverImage.startsWith('data:image')) {
        coverImageUrl = await uploadImage(coverImage, 'blog/covers');
    }

    const article = await Article.create({
        title,
        content,
        coverImage: coverImageUrl,
        tags: tags || [],
        category,
        status: status || 'draft',
        metaDescription,
        author: authorId,
    });

    await article.populate('author', 'name email avatar');

    return article;
};

// Service: Get all published articles
const getArticles = async ({ page = 1, limit = 10, tag, category, search }) => {
    const query = { status: 'published' };
    if (tag) query.tags = tag;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const articles = await Article.find(query)
        .populate('author', 'name email avatar')
        .sort({ publishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const count = await Article.countDocuments(query);

    const articlesWithVirtuals = articles.map(a => a.toObject());

    return {
        articles: articlesWithVirtuals,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page), total: count
    };
};

// Service: Get article by slug
const getArticleBySlug = async (slug) => {
    const article = await Article.findOne({ slug })
        .populate('author', 'name email avatar bio followers following articlesCount');

    if (!article) throw new AppError('Article not found', 404);

    // Increment views asynchronously
    Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).exec();

    return article.toObject();
};

// Service: Delete article (includes Cloudinary cleanup)
const deleteArticle = async (article, userId) => {
    if (article.author.toString() !== userId.toString()) {
        throw new AppError('Not authorized to delete this article', 403);
    }

    // Delete cover image
    if (article.coverImage?.includes('cloudinary')) {
        const publicId = extractPublicId(article.coverImage);
        if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    // Delete images in content blocks
    if (article.content?.blocks) {
        for (const block of article.content.blocks.filter(b => b.type === 'image' && b.data?.file?.url)) {
            if (block.data.file.url.includes('cloudinary')) {
                const publicId = extractPublicId(block.data.file.url);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }
        }
    }

    await article.deleteOne();
};

const getArticleById = async (articleId, userId) => {

    const article = await Article.findById(articleId)
        .populate("author", "name email avatar bio")
        .lean();

    if (!article) {
        throw new AppError("Article not found", 404);
    }

    if (article.author._id.toString() !== userId.toString()) {
        throw new AppError("Not authorized to access this article", 403);
    }

    return article;
};

// Service: Update Article
const updateArticle = async (articleId, userId, updateData) => {
    const article = await Article.findById(articleId);
    if (!article) throw new AppError('Article not found', 404);

    if (article.author.toString() !== userId.toString()) {
        throw new AppError('Not authorized to update this article', 403);
    }

    // Validate content if provided
    if (updateData.content) {
        validateEditorContent(updateData.content);
    }

    // Handle new coverImage upload
    if (updateData.coverImage?.startsWith('data:image')) {
        // Delete old cover image
        if (article.coverImage?.includes('cloudinary')) {
            const publicId = extractPublicId(article.coverImage);
            if (publicId) await cloudinary.uploader.destroy(publicId);
        }
        // Upload new image
        updateData.coverImage = await uploadImage(updateData.coverImage, 'blog/covers');
    }

    const updatedArticle = await Article.findByIdAndUpdate(articleId, updateData, {
        new: true,
        runValidators: true,
    }).populate('author', 'name email avatar');

    return updatedArticle;
};

// Service: Toggle Like
const toggleLike = async (articleId, userId) => {
    const article = await Article.findById(articleId);
    if (!article) throw new AppError('Article not found', 404);

    await article.toggleLike(userId); // assume method exists on model

    return {
        likesCount: article.likesCount,
        isLiked: article.likes.includes(userId),
    };
};

// Service: Get My Articles (drafts + published)
const getMyArticles = async (userId) => {
    const articles = await Article.find({ author: userId }).sort({ createdAt: -1 });
    return articles.map(a => a.toObject());
};

// Service: Get Featured Articles
const getFeaturedArticles = async () => {
    const articles = await Article.find({ status: 'published', isFeatured: true })
        .populate('author', 'name avatar')
        .sort({ publishedAt: -1 })
        .limit(5);
    return articles.map(a => a.toObject());
};

module.exports = {
    createArticle,
    getArticles,
    getArticleBySlug,
    getArticleById,
    deleteArticle,
    updateArticle,
    toggleLike,
    getMyArticles,
    getFeaturedArticles
};

