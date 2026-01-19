// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
        },

        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },

        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 5,
            select: false, // Don't return password by default
        },

        avatar: {
            type: String,
            default: null,
        },

        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        // Social links
        website: String,
        twitter: String,
        github: String,
        linkedin: String,

        // Articles count
        articlesCount: {
            type: Number,
            default: 0,
        },

        // Followers
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Virtual for followers count
userSchema.virtual('followersCount').get(function () {
    return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function () {
    return this.following ? this.following.length : 0;
});

const User = mongoose.model('User', userSchema);

module.exports = User;