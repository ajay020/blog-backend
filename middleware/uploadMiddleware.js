const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const getExtension = (file) => {
    if (file.mimetype == "image/jpeg")
    ext =  ".jpeg"
    else
        ext =".png"
    return ext;
}

//initialize multer
let storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + uuidv4() + getExtension(file))
    }
 })
 let upload = multer({storage: storage})

 module.exports = upload;