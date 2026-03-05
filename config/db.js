const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/blogdb";

        await mongoose.connect(mongoURI, {
            
        });

        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;