const mongoose = require('mongoose');

const PRODUCT_CATEGORIES = ['상의', '하의', '악세서리'];

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: [true, 'product_id is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price must be greater than or equal to 0'],
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: 'category must be 상의, 하의, or 악세서리',
      },
    },
    image: {
      type: String,
      required: [true, 'image is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
