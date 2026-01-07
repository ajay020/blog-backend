const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Post = require('../models/postModel');


const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

const googleAuth = async (req, res) => {
    const {googleTokenId} = req.body; 
    
    const ticket = await client.verifyIdToken({
        idToken: googleTokenId,
        audience: process.env.CLIENT_ID 
    })

    const { name, email, picture } = ticket.getPayload(); 

    let user = await User.findOne({email}).select('-password');
    if(!user){
        user = await User.create({name, email});
    }
    // console.log(">>>>",user._doc);
    res.json({...user._doc, token: googleTokenId}); 
}

const login = async (req, res) => {
    const {email, password}  = req.body;
    try {
        const user = await User.findOne({email}).populate('bookmarkedPosts', 'title');
        if(user && (await bcrypt.compare(password, user.password))){

            res.status(201).json({
                _id: user._id,
                name: user.name, 
                email:user.email,
                bookmarkedPosts: user.bookmarkedPosts, 
                token: generateToken(user._id)
            })
        } else{
           return res.status(400).json({message: "Invalid credentails"});
        }

   } catch (error) {
       console.log(error);
       res.status(400).json({err: error.message});
   }  
}

const register = async (req, res) => {
   const {name, email, password}  = req.body;

   if(!name || !email || !password){
       return res.status(400).json({msg: "Please add all fields"});
   }

   try {
       const existedUser = await User.findOne({email});
       if(existedUser){
           return res.status(400).json({message: "User is already exist!"});
       }

      const salt = await bcrypt.genSalt(10) ;
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({name, email, password: hashedPassword});

      res.json({id:user.id, name:user.name, email: user.email ,token : generateToken(user._id)});

  } catch (error) {
      console.log(error);
      res.status(400).json({err: error.message});
  }
}

const getMe = async(req, res) => {
    try {
        const {_id, name, email} = await User.findById(req.user.id);
        return res.status(201).json({
            id: _id,
            name, 
            email 
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({err: error.message});
    }
}

const bookmarkPost = async(req, res)=>{
    const {postId} = req.body;
    try {
        let post = await Post.findById(postId);
        if(!post){
            return res.status(400).json({msg: "No post found with given postId"});
        }

        let user = await User.findById(req.user._id).select('-password');
        
        if(user.bookmarkedPosts.includes(postId)){
            await user.bookmarkedPosts.pull(postId);
            await user.save();
            // res.status(200).json({msg: "removed bookmark successfully!"});
        }else{
            await user.bookmarkedPosts.push(postId);
            await user.save();
            // res.status(200).json({msg: "bookmarked successfully!"});
        }

        res.status(200).json({_id: post._id, title: post.title});


    } catch (error) {
        console.log(error);
        res.status(400).json({err: error.message});
    }
}

const getBookMarkPosts = async(req, res) =>{
    try {
     const user = await User.findById(req.user._id).populate("bookmarkedPosts", 'title');
    //   console.log("bookmarks", user.bookmarkedPosts);
     res.status(200).json( user.bookmarkedPosts);
    } catch (error) {
        console.log(error);
        res.status(400).json({err: error.message});
    }
}

const generateToken = (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET_KEY, {expiresIn:"30d"});
}


module.exports = {
    login, 
    register,
    googleAuth,
    getMe,
    bookmarkPost,
    getBookMarkPosts
}