const mongoose = require('mongoose');

const USER_TYPES = ['customer', 'seller', 'admin'];

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: [true, 'user_id is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    user_type: {
      type: String,
      required: [true, 'user_type is required'],
      enum: {
        values: USER_TYPES,
        message: 'user_type must be customer, seller, or admin',
      },
      default: 'customer',
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
