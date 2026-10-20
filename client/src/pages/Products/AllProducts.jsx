import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories } from '../../api/categoryApi';
import { getProducts } from '../../api/productApi';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import HomeHeader from '../Home/HomeHeader';
import ProductCard from '../Home/ProductCard';
import '../Home/Home.css';
import './AllProducts.css';

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const INITIAL_PAGINATION = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const toCardProduct = (product) => ({
  id: product._id,
  brand: product.category,
  name: product.name,
  price: `${Number(product.price).toLocaleString()}원`,
  image: product.image,
});

function AllProducts() {
  const { user, isAdmin, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || '';
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limitParam = parseInt(searchParams.get('limit'), 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(limitParam) ? limitParam : DEFAULT_PAGE_SIZE;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsFetching(true);
      setError('');

      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts({
            category: activeCategory || undefined,
            page,
            limit: pageSize,
          }),
          getCategories(),
        ]);

        if (cancelled) return;

        setProducts(Array.isArray(productsResult.data) ? productsResult.data : []);
        setPagination(productsResult.pagination || { ...INITIAL_PAGINATION, page, limit: pageSize });
        setCategories(
          (Array.isArray(categoriesResult.data) ? categoriesResult.data : [])
            .map((item) => item.name)
            .filter(Boolean)
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '상품을 불러오지 못했습니다.');
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, page, pageSize]);

  const cardProducts = useMemo(() => products.map(toCardProduct), [products]);

  const updateParams = (next) => {
    const merged = {
      category: activeCategory || undefined,
      page: String(page),
      limit: String(pageSize),
      ...next,
    };

    const params = {};
    if (merged.category) params.category = merged.category;
    params.limit = merged.limit;
    if (merged.page) params.page = merged.page;

    setSearchParams(params);
  };

  const handleTabChange = (category) => {
    updateParams({ category: category || undefined, page: '1' });
  };

  const handlePageSizeChange = (event) => {
    updateParams({ limit: event.target.value, page: '1' });
  };

  const handlePrevPage = () => {
    updateParams({ page: String(Math.max(1, page - 1)) });
  };

  const handleNextPage = () => {
    updateParams({ page: String(page + 1) });
  };

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="home-page">
      <HomeHeader user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main>
        <section className="home-section all-products">
          <div className="home-section__header">
            <h2 className="home-section__title">All Products</h2>
          </div>

          <div className="all-products__toolbar">
            <div className="home-section__tabs all-products__tabs" role="tablist" aria-label="상품 카테고리">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === ''}
                className={`home-section__tab${activeCategory === '' ? ' is-active' : ''}`}
                onClick={() => handleTabChange('')}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={`home-section__tab${activeCategory === category ? ' is-active' : ''}`}
                  onClick={() => handleTabChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <label className="all-products__page-size">
              <span>보기</span>
              <select value={pageSize} onChange={handlePageSizeChange}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}개씩
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p className="home-products-error" role="alert">
              {error}
            </p>
          )}

          {isFetching ? (
            <p className="home-products-empty">상품을 불러오는 중...</p>
          ) : cardProducts.length === 0 ? (
            <p className="home-products-empty">표시할 상품이 없습니다.</p>
          ) : (
            <>
              <div className="home-products">
                {cardProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="all-products__pagination">
                <p className="all-products__pagination-info">
                  총 {pagination.total}개 · {pagination.page}/{pagination.totalPages} 페이지
                </p>
                <div className="all-products__pagination-actions">
                  <button
                    type="button"
                    className="all-products__page-btn"
                    disabled={!pagination.hasPrevPage || isFetching}
                    onClick={handlePrevPage}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    className="all-products__page-btn"
                    disabled={!pagination.hasNextPage || isFetching}
                    onClick={handleNextPage}
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}

export default AllProducts;
