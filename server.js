const express = require('express');
const db = require('./config/db');
const cors = require('cors');
const colors = require('colors');
const morgan = require('morgan');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

//connect to MongoDB
db();

// Logging middleware
app.use(morgan("dev"));

//body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow requests from your frontend
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.static('public'));

app.use("/api/posts", require('./routes/postRoutes'));
app.use("/api/users", require('./routes/userRoutes'));


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

