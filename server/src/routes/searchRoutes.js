const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const {
  searchProducts,
  getSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
  getPopularKeywords,
} = require('../controllers/searchController');

const router = express.Router();

router.get('/', optionalAuthMiddleware, searchProducts);
router.get('/popular', getPopularKeywords);
router.get('/history', authMiddleware, getSearchHistory);
router.delete('/history/:id', authMiddleware, deleteSearchHistoryItem);
router.delete('/history', authMiddleware, clearSearchHistory);

module.exports = router;
