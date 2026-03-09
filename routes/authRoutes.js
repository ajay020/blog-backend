const express = require('express');
const {
    register,
    login,
    getMe,
    updateDetails,
    updatePassword,
    logout,
    deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');

const router = express.Router();

// Public routes
router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);
router.delete('/account', protect, deleteAccount);

module.exports = router;