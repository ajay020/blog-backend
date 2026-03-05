const dotenv = require("dotenv");

// Load env based on NODE_ENV
if (process.env.NODE_ENV === "production") {
    dotenv.config({ path: ".env.production" });
} else {
    // defaults to .env
    dotenv.config();
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};

startServer();