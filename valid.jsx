const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  searchUsers,
  getMyCredits,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getUserById,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Specific routes first, dynamic /:id last
router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateMyProfile);
router.get('/search', protect, searchUsers);
router.get('/credits', protect, getMyCredits);

router.post('/portfolio', protect, addPortfolioItem);
router.put('/portfolio/:itemId', protect, updatePortfolioItem);
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);

router.get('/:id', protect, getUserById);

module.exports = router;