const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const colors = require('colors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

//connect to MongoDB
db();

//body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// app.use(session({
//     secret: 'keyboard cat',
//     resave: true,
//     saveUninitialized: false,
//     // cookie:{maxAge: 60000}
// }))


app.use("/api/posts", require('./routes/postRoutes'));
app.use("/api/users", require('./routes/userRoutes'));

//server frontend
// if(process.env.NODE_ENV === 'production'){
//     app.use(express.static(path.join(__dirname, '../frontend/build')));

//     app.get("*", (req,res) => res.sendFile(
//         path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')
//     ))
// }else{
//     app.get("/", (req, res) => res.send('Please set to production'))
// }


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

