const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

// user_id, email 등 고유 필드 중복 시 409 응답 반환
const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyPattern)[0];
  return res.status(409).json({
    success: false,
    message: `${field} already exists`,
  });
};

// GET /api/users — 전체 사용자 목록 조회 (password 제외)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id — MongoDB _id로 특정 사용자 조회 (password 제외)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    next(error);
  }
};

// POST /api/users — 새 사용자 생성
const createUser = async (req, res, next) => {
  try {
    const { user_id, name, email, password, user_type, address } = req.body;
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      user_id,
      name,
      email,
      password: hashedPassword,
      user_type,
      address,
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
      });
    }
    next(error);
  }
};

// PUT /api/users/:id — 사용자 정보 수정 (요청 body에 포함된 필드만 부분 수정)
const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['user_id', 'name', 'email', 'password', 'user_type', 'address'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
      });
    }
    next(error);
  }
};

// DELETE /api/users/:id — 사용자 삭제
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    next(error);
  }
};

// POST /api/auth/login — 이메일/비밀번호 로그인
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const userData = user.toObject();
    delete userData.password;

    const token = generateToken({
      id: user._id,
      user_id: user.user_id,
      email: user.email,
      user_type: user.user_type,
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me — 토큰으로 현재 로그인 사용자 정보 조회
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getCurrentUser,
};
