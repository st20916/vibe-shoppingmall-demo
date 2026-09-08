import { useEffect, useMemo, useState } from 'react';
import { getPublicProducts } from '../../api/productApi';
import { HERO_BANNERS, NEW_ARRIVALS_LIMIT } from '../../data/homeData';
import { PRODUCT_CATEGORIES } from '../../data/productData';
import { useAuth } from '../../hooks/useAuth';
import HeroBanner from './HeroBanner';
import HomeFooter from './HomeFooter';
import HomeHeader from './HomeHeader';
import ProductSection from './ProductSection';
import './Home.css';

const toCardProduct = (product, { isNew = false } = {}) => ({
  id: product._id,
  brand: product.category,
  name: product.name,
  price: `${Number(product.price).toLocaleString()}원`,
  image: product.image,
  isNew,
});

function Home() {
  const { user, isAdmin, logout } = useAuth();
  const [activeHotTab, setActiveHotTab] = useState(PRODUCT_CATEGORIES[0]);
  const [products, setProducts] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await getPublicProducts();
        if (!cancelled) {
          setProducts(result.data || []);
        }
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

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const hotPickProducts = useMemo(() => {
    return products
      .filter((product) => product.category === activeHotTab)
      .map((product) => toCardProduct(product));
  }, [products, activeHotTab]);

  const newArrivals = useMemo(() => {
    return products
      .slice(0, NEW_ARRIVALS_LIMIT)
      .map((product) => toCardProduct(product, { isNew: true }));
  }, [products]);

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="home-page">
      <HomeHeader user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main>
        <HeroBanner banners={HERO_BANNERS} />

        {error && (
          <p className="home-products-error" role="alert">
            {error}
          </p>
        )}

        {isFetching ? (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">상품 불러오는 중...</h2>
            </div>
          </section>
        ) : (
          <>
            <ProductSection
              id="best"
              title="Hot Pick"
              moreHref="#best"
              tabs={PRODUCT_CATEGORIES}
              activeTab={activeHotTab}
              onTabChange={setActiveHotTab}
              products={hotPickProducts}
              emptyMessage={`${activeHotTab} 카테고리 상품이 없습니다.`}
            />

            <ProductSection
              id="new"
              title="New Arrivals"
              moreHref="#new"
              products={newArrivals}
              emptyMessage="등록된 상품이 없습니다."
            />
          </>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}

export default Home;
