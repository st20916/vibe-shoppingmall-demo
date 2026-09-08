const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCart,
  createCart,
  updateCart,
  deleteCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartItems,
} = require('../controllers/cartController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/', createCart);
router.put('/', updateCart);
router.delete('/', deleteCart);

router.post('/items', addCartItem);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/items', clearCartItems);

module.exports = router;
