const mongoose = require('mongoose');

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
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'image is required'],
      trim: true,
    },
    detailImage: {
      type: String,
      trim: true,
      default: '',
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
