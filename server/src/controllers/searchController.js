const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');

const HISTORY_LIMIT = 20;
const POPULAR_LIMIT = 10;
const POPULAR_WINDOW_DAYS = 14;

// GET /api/search — 상품 검색 (q 필수, name/product_id/category 대상)
// Query: q(필수), page, limit(선택, 페이지네이션, 기본 limit=20)
// 로그인 사용자가 검색하면 검색 기록을 자동으로 저장한다 (req.user는 optionalAuthMiddleware가 채움)
const searchProducts = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!q) {
      return res.status(400).json({ success: false, message: 'q is required' });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { product_id: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ],
    };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-product_id -description -detailImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    if (req.user?.id) {
      SearchHistory.create({ user: req.user.id, keyword: q }).catch(() => {});
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      query: q,
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

// GET /api/search/history — 내 최근 검색어 조회 (최신순, 대소문자 무시 중복 제거, 최대 20개)
const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    const seen = new Set();
    const deduped = [];

    for (const item of history) {
      const key = item.keyword.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= HISTORY_LIMIT) break;
    }

    res.json({ success: true, data: deduped });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/search/history/:id — 검색 기록 1건 삭제 (본인 소유만 가능)
const deleteSearchHistoryItem = async (req, res, next) => {
  try {
    const item = await SearchHistory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Search history not found' });
    }

    if (String(item.user) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await item.deleteOne();

    res.json({ success: true, message: 'Search history deleted' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid search history id' });
    }
    next(error);
  }
};

// DELETE /api/search/history — 내 검색 기록 전체 삭제
const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};

// GET /api/search/popular — 최근 14일 인기 검색어 TOP 10 (전체 사용자 집계, 로그인 불필요)
const getPopularKeywords = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - POPULAR_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const results = await SearchHistory.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $toLower: '$keyword' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: POPULAR_LIMIT },
    ]);

    res.json({
      success: true,
      data: results.map((row) => ({ keyword: row._id, count: row.count })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProducts,
  getSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
  getPopularKeywords,
};
