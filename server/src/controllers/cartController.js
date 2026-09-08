const Cart = require('../models/Cart');
const Product = require('../models/Product');

const handleValidationError = (error, res) => {
  return res.status(400).json({
    success: false,
    message: Object.values(error.errors)
      .map((err) => err.message)
      .join(', '),
  });
};

const recalculateCart = (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};

const populateCart = (query) =>
  query.populate('items.product', 'name price category image description');

const findOrCreateCart = async (userId) => {
  let cart = await populateCart(Cart.findOne({ user: userId }));

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await populateCart(Cart.findById(cart._id));
  }

  return cart;
};

const getProductIdString = (item) => {
  if (!item?.product) return '';
  return typeof item.product === 'object' && item.product._id
    ? String(item.product._id)
    : String(item.product);
};

// GET /api/cart — 내 장바구니 조회 (없으면 생성)
const getCart = async (req, res, next) => {
  try {
    const cart = await findOrCreateCart(req.user.id);
    res.json({ success: true, data: cart });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    next(error);
  }
};

// POST /api/cart — 장바구니 생성 (이미 있으면 기존 반환)
const createCart = async (req, res, next) => {
  try {
    const existing = await populateCart(Cart.findOne({ user: req.user.id }));

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Cart already exists',
        data: existing,
      });
    }

    const cart = await Cart.create({ user: req.user.id, items: [] });
    const populated = await populateCart(Cart.findById(cart._id));

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      const cart = await findOrCreateCart(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Cart already exists',
        data: cart,
      });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// PUT /api/cart — 장바구니 아이템 전체 교체
// Body: { items: [{ product, quantity }] }
const updateCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'items must be an array',
      });
    }

    const nextItems = [];

    for (const item of items) {
      if (!item?.product) {
        return res.status(400).json({
          success: false,
          message: 'product is required for each item',
        });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'quantity must be an integer greater than or equal to 1',
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const productId = String(product._id);
      const existingIndex = nextItems.findIndex(
        (entry) => String(entry.product) === productId
      );

      if (existingIndex >= 0) {
        nextItems[existingIndex].quantity += quantity;
      } else {
        nextItems.push({
          product: product._id,
          quantity,
          price: product.price,
        });
      }
    }

    const cart = await findOrCreateCart(req.user.id);
    cart.items = nextItems;
    recalculateCart(cart);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// DELETE /api/cart — 장바구니 삭제
const deleteCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    res.json({ success: true, message: 'Cart deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    next(error);
  }
};

// POST /api/cart/items — 상품 담기
// Body: { product, quantity? }
const addCartItem = async (req, res, next) => {
  try {
    const { product: productId } = req.body;
    const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'product is required' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be an integer greater than or equal to 1',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await findOrCreateCart(req.user.id);
    const existingItem = cart.items.find(
      (item) => getProductIdString(item) === String(product._id)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: product.price,
      });
    }

    recalculateCart(cart);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// PUT /api/cart/items/:productId — 상품 수량 변경
// Body: { quantity }
const updateCartItem = async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be an integer greater than or equal to 1',
      });
    }

    const cart = await findOrCreateCart(req.user.id);
    const item = cart.items.find(
      (entry) => getProductIdString(entry) === String(req.params.productId)
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    item.quantity = quantity;
    item.price = product.price;
    recalculateCart(cart);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// DELETE /api/cart/items/:productId — 장바구니에서 상품 제거
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await findOrCreateCart(req.user.id);
    const beforeCount = cart.items.length;

    cart.items = cart.items.filter(
      (item) => getProductIdString(item) !== String(req.params.productId)
    );

    if (cart.items.length === beforeCount) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    recalculateCart(cart);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    next(error);
  }
};

// DELETE /api/cart/items — 장바구니 비우기 (문서는 유지)
const clearCartItems = async (req, res, next) => {
  try {
    const cart = await findOrCreateCart(req.user.id);
    cart.items = [];
    recalculateCart(cart);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  createCart,
  updateCart,
  deleteCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartItems,
};
