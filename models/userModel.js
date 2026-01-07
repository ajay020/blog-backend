const mongoose = require('mongoose');
const {Schema} = mongoose; 

const userSchema = Schema({
    name: {
        type:String,
        required:[true, 'Plaeas add name']
    },
    email:{
        type:String,
        required: [true, 'Please add an email']
    },
    password: {
        type:String,
        required:[false, 'Please add password']
    },
    // bookmarkedPosts:{
    //     type: [mongoose.Types.ObjectId]
    // },
    bookmarkedPosts:[{
        type: mongoose.Types.ObjectId, 
        ref: 'Post'
    }]
},
{
    timestamps:true 
});

module.exports = mongoose.model('User', userSchema);