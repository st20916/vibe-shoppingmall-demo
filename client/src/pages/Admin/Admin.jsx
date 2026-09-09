import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/productApi';
import { getUserCount } from '../../api/userApi';
import { ADMIN_STATS } from '../../data/adminData';
import { useAuth } from '../../hooks/useAuth';
import AdminHeader from './AdminHeader';
import AdminProductCard from './AdminProductCard';
import AdminSidebar from './AdminSidebar';
import HomeFooter from '../Home/HomeFooter';
import './Admin.css';

const RECENT_PRODUCT_LIMIT = 10;

function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [recentProducts, setRecentProducts] = useState([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [memberCount, setMemberCount] = useState(null);
  const [isFetchingMemberCount, setIsFetchingMemberCount] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    let cancelled = false;

    const fetchRecentProducts = async () => {
      setIsFetchingProducts(true);
      setProductsError('');

      try {
        const result = await getProducts({ page: 1, limit: RECENT_PRODUCT_LIMIT });
        if (!cancelled) {
          setRecentProducts(result.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setProductsError(err.message || '상품 목록을 불러오지 못했습니다.');
          setRecentProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingProducts(false);
        }
      }
    };

    const fetchMemberCount = async () => {
      setIsFetchingMemberCount(true);

      try {
        const result = await getUserCount();
        if (!cancelled) {
          setMemberCount(Number(result.data?.count) || 0);
        }
      } catch {
        if (!cancelled) {
          setMemberCount(null);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingMemberCount(false);
        }
      }
    };

    fetchRecentProducts();
    fetchMemberCount();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const profileStats = useMemo(
    () =>
      ADMIN_STATS.map((stat) => {
        if (stat.label !== '회원 수') return stat;

        return {
          ...stat,
          value: isFetchingMemberCount
            ? '...'
            : memberCount === null
              ? '-'
              : memberCount.toLocaleString(),
        };
      }),
    [isFetchingMemberCount, memberCount]
  );

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="admin-page admin-page--loading">
        <p>권한을 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminHeader
        user={user}
        onLogout={() => {
          logout();
          alert('로그아웃 되었습니다.');
          navigate('/', { replace: true });
        }}
      />

      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-main">
          <section className="admin-profile">
            <div className="admin-profile__user">
              <div className="admin-profile__avatar" aria-hidden="true" />
              <div>
                <h1>{user.name} 님</h1>
                <p>관리자 대시보드</p>
                <button type="button" className="admin-profile__badge">
                  ADMIN
                </button>
              </div>
            </div>
            <div className="admin-profile__stats">
              {profileStats.map((stat) => (
                <div key={stat.label} className="admin-profile__stat">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-section">
            <div className="admin-section__header">
              <h2>최근 등록 상품</h2>
              <Link to="/admin/products">전체보기 &gt;</Link>
            </div>

            {productsError && <p className="admin-products-error">{productsError}</p>}

            {isFetchingProducts ? (
              <div className="admin-empty admin-empty--sm">
                <p>상품 목록을 불러오는 중...</p>
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="admin-empty">
                <p>등록된 상품이 없습니다.</p>
                <Link to="/admin/products?tab=register" className="admin-empty__link">
                  상품 등록하기
                </Link>
              </div>
            ) : (
              <div className="admin-products">
                {recentProducts.map((product) => (
                  <AdminProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </section>

          <section className="admin-banner" aria-label="프로모션">
            <div>
              <p className="admin-banner__eyebrow">PRODUCT</p>
              <h2>새 상품을 등록하세요</h2>
              <p>상품 목록 확인, 검색·필터, 신규 등록을 한 곳에서 관리합니다.</p>
            </div>
            <div className="admin-banner__actions">
              <Link to="/admin/products?tab=register" className="admin-banner__btn">
                새 상품 등록하기
              </Link>
              <Link to="/admin/products" className="admin-banner__btn admin-banner__btn--ghost">
                상품 목록 보기
              </Link>
            </div>
          </section>
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}

export default Admin;
