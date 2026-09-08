const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getOrders,
  getAdminOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/admin', getAdminOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
