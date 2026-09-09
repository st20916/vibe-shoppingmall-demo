const Product = require('../models/Product');
const Category = require('../models/Category');
const { ensureDefaultCategories } = Category;

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

const assertValidCategory = async (categoryName) => {
  await ensureDefaultCategories();
  const name = typeof categoryName === 'string' ? categoryName.trim() : '';
  if (!name) {
    const error = new Error('category is required');
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.findOne({ name });
  if (!category) {
    const error = new Error('category does not exist');
    error.statusCode = 400;
    throw error;
  }

  return name;
};

// GET /api/products — 전체 상품 조회 (페이지네이션: 기본 10개)
// Query: page(기본 1), limit(기본 10), category(선택), q(선택: name/product_id 검색)
const getAllProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) {
      filter.category = String(req.query.category).trim();
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { product_id: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id — MongoDB _id로 특정 상품 조회
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    next(error);
  }
};

// POST /api/products — 상품 등록
const createProduct = async (req, res, next) => {
  try {
    const { product_id, name, price, category, image, description } = req.body;
    const validCategory = await assertValidCategory(category);

    const product = await Product.create({
      product_id,
      name,
      price,
      category: validCategory,
      image,
      description,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
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

// PUT /api/products/:id — 상품 수정 (요청 body에 포함된 필드만 부분 수정)
const updateProduct = async (req, res, next) => {
  try {
    const allowedFields = ['product_id', 'name', 'price', 'category', 'image', 'description'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.category !== undefined) {
      updates.category = await assertValidCategory(updates.category);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
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

// DELETE /api/products/:id — 상품 삭제
// Body: { confirm: true, product_id: "..." } — 실수 삭제 방지를 위한 검증 필수
const deleteProduct = async (req, res, next) => {
  try {
    const { confirm, product_id } = req.body || {};

    if (confirm !== true) {
      return res.status(400).json({
        success: false,
        message: 'Delete confirmation is required',
      });
    }

    if (!product_id || typeof product_id !== 'string' || !product_id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required for delete verification',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.product_id !== product_id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'product_id does not match',
      });
    }

    await product.deleteOne();

    res.json({ success: true, message: 'Product deleted successfully', data: { id: product._id } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    next(error);
  }
};

// GET /api/products/public — 메인용 전체 상품 조회 (product_id, description 제외)
const getPublicProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .select('-product_id -description')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getPublicProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
