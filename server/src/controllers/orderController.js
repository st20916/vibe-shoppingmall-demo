const Order = require('../models/Order');
const ORDER_STATUS = Order.ORDER_STATUS;
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { verifyPortonePayment } = require('../utils/portone');

const handleValidationError = (error, res) => {
  return res.status(400).json({
    success: false,
    message: Object.values(error.errors)
      .map((err) => err.message)
      .join(', '),
  });
};

const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyPattern)[0];
  return res.status(409).json({
    success: false,
    message: `${field} already exists`,
  });
};

const generateOrderId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD${date}${rand}`;
};

const getProductIdString = (item) => {
  if (!item?.product) return '';
  return typeof item.product === 'object' && item.product._id
    ? String(item.product._id)
    : String(item.product);
};

const buildOrderItemsFromCart = async (cartItems) => {
  const orderItems = [];

  for (const item of cartItems) {
    const productId = getProductIdString(item);
    const product = await Product.findById(productId);

    if (!product) {
      const error = new Error(`Product not found: ${productId}`);
      error.statusCode = 404;
      throw error;
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      const error = new Error('quantity must be an integer greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }

    orderItems.push({
      product: product._id,
      product_id: product.product_id,
      name: product.name,
      image: product.image,
      price: item.price ?? product.price,
      quantity,
    });
  }

  return orderItems;
};

const recalculateTotals = (items) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, totalAmount };
};

const isOrderOwner = (order, userId) => String(order.user) === String(userId);

// GET /api/orders — 내 주문 목록 (?status= optional)
const getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };

    if (status) {
      if (!ORDER_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${ORDER_STATUS.join(', ')}`,
        });
      }
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/admin — 관리자 전체 주문 목록 (?status= optional)
const getAdminOrders = async (req, res, next) => {
  try {
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!ORDER_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${ORDER_STATUS.join(', ')}`,
        });
      }
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email user_id')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/admin/counts — 관리자 주문 상태별 개수
const getAdminOrderCounts = async (req, res, next) => {
  try {
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const grouped = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = ORDER_STATUS.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

    grouped.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(counts, row._id)) {
        counts[row._id] = row.count;
      }
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      data: {
        total,
        counts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id — 주문 상세 (본인 주문만)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isOrderOwner(order, req.user.id) && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    next(error);
  }
};

// POST /api/orders — 결제 검증 후 장바구니 기반 주문 생성
// Body: { imp_uid, merchant_uid }
const createOrder = async (req, res, next) => {
  try {
    const { imp_uid: impUid, merchant_uid: merchantUid } = req.body;

    if (!impUid || !merchantUid) {
      return res.status(400).json({
        success: false,
        message: 'imp_uid and merchant_uid are required',
      });
    }

    // 1) 주문 중복 여부 체크 (동일 결제건 재요청 방지)
    const duplicatedOrder = await Order.findOne({
      $or: [{ imp_uid: impUid }, { merchant_uid: merchantUid }],
    });

    if (duplicatedOrder) {
      return res.status(409).json({
        success: false,
        message: 'Order already exists for this payment',
        data: duplicatedOrder,
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      'items.product',
      'product_id name price image'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const items = await buildOrderItemsFromCart(cart.items);
    const { totalItems, totalAmount } = recalculateTotals(items);

    // 2) 포트원 결제 검증 (상태·금액·merchant_uid)
    await verifyPortonePayment({
      impUid,
      merchantUid,
      expectedAmount: totalAmount,
    });

    let order;
    let attempts = 0;

    // order_id 충돌 시 재시도 (merchant_uid를 우선 사용)
    while (attempts < 5) {
      try {
        order = await Order.create({
          order_id: attempts === 0 ? merchantUid : generateOrderId(),
          user: req.user.id,
          items,
          totalItems,
          totalAmount,
          imp_uid: impUid,
          merchant_uid: merchantUid,
          status: 'paid',
        });
        break;
      } catch (error) {
        if (error.code === 11000) {
          if (error.keyPattern?.imp_uid || error.keyPattern?.merchant_uid) {
            return handleDuplicateKeyError(error, res);
          }
          if (error.keyPattern?.order_id) {
            attempts += 1;
            continue;
          }
        }
        throw error;
      }
    }

    if (!order) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique order_id',
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    next(error);
  }
};

// PUT /api/orders/:id — 주문 상태 수정
// Body: { status, cancelReason? } — status가 cancelled일 때 cancelReason 필수
const updateOrder = async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    if (!ORDER_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${ORDER_STATUS.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.user_type === 'admin';
    const isOwner = isOrderOwner(order, req.user.id);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // 일반 사용자는 본인 주문을 cancelled로만 변경 가능
    if (!isAdmin && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Only cancelled status is allowed for customers',
      });
    }

    if (!isAdmin && !['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or paid orders can be cancelled',
      });
    }

    const trimmedReason =
      typeof cancelReason === 'string' ? cancelReason.trim() : '';

    if (status === 'cancelled') {
      if (!trimmedReason) {
        return res.status(400).json({
          success: false,
          message: 'cancelReason is required when status is cancelled',
        });
      }
      order.cancelReason = trimmedReason;
    } else {
      order.cancelReason = '';
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// DELETE /api/orders/:id — 주문 삭제 (admin) / 또는 본인 pending 주문 삭제
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.user_type === 'admin';
    const isOwner = isOrderOwner(order, req.user.id);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isAdmin && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be deleted',
      });
    }

    await order.deleteOne();

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    next(error);
  }
};

module.exports = {
  getOrders,
  getAdminOrders,
  getAdminOrderCounts,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
