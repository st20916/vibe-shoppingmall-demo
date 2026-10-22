const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const searchRoutes = require('./searchRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/search', searchRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  });
});

module.exports = router;
