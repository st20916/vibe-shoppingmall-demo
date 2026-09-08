const mongoose = require('mongoose');

const ORDER_STATUS = [
  'pending',
  'paid',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'product is required'],
    },
    product_id: {
      type: String,
      required: [true, 'product_id is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'image is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price must be greater than or equal to 0'],
    },
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: [1, 'quantity must be at least 1'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: [true, 'order_id is required'],
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'items must not be empty',
      },
    },
    totalItems: {
      type: Number,
      required: [true, 'totalItems is required'],
      min: [1, 'totalItems must be at least 1'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'totalAmount is required'],
      min: [0, 'totalAmount must be greater than or equal to 0'],
    },
    imp_uid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    merchant_uid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ORDER_STATUS,
        message: `status must be one of: ${ORDER_STATUS.join(', ')}`,
      },
      default: 'pending',
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: [500, 'cancelReason must be at most 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUS = ORDER_STATUS;
