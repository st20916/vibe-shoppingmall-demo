const Category = require('../models/Category');
const Product = require('../models/Product');
const { DEFAULT_CATEGORY_NAMES, ensureDefaultCategories } = Category;

const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyPattern)[0];
  return res.status(409).json({
    success: false,
    message: `${field} already exists`,
  });
};

const handleValidationError = (error, res) => {
  return res.status(400).json({
    success: false,
    message: Object.values(error.errors)
      .map((err) => err.message)
      .join(', '),
  });
};

const isProtectedCategory = (category) =>
  Boolean(category?.isDefault) || DEFAULT_CATEGORY_NAMES.includes(category?.name);

// GET /api/categories — 카테고리 목록
const getAllCategories = async (req, res, next) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find().sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id — 카테고리 단건 조회
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }
    next(error);
  }
};

// POST /api/categories — 카테고리 추가
// Body: { name }
const createCategory = async (req, res, next) => {
  try {
    await ensureDefaultCategories();

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    const category = await Category.create({
      name,
      isDefault: DEFAULT_CATEGORY_NAMES.includes(name),
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// PUT /api/categories/:id — 카테고리 수정
// Body: { name }
const updateCategory = async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = category.name;

    if (oldName === name) {
      return res.json({ success: true, data: category });
    }

    category.name = name;
    // 기본 카테고리는 이름만 바꿔도 isDefault 유지
    if (DEFAULT_CATEGORY_NAMES.includes(oldName)) {
      category.isDefault = true;
    }
    await category.save();

    await Product.updateMany({ category: oldName }, { $set: { category: name } });

    res.json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    if (error.name === 'ValidationError') {
      return handleValidationError(error, res);
    }
    next(error);
  }
};

// DELETE /api/categories/:id — 카테고리 삭제 (기본 3개는 삭제 불가)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (isProtectedCategory(category)) {
      return res.status(403).json({
        success: false,
        message: 'Default categories (상의, 하의, 악세서리) cannot be deleted',
      });
    }

    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category is in use by products and cannot be deleted',
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: { id: category._id },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
