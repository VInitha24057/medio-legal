const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin only routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// Get doctors list (for police to assign)
router.get('/doctors', protect, authorize('police', 'admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('fullName email hospital department');
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
