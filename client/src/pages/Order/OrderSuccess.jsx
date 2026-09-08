import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import './OrderResult.css';

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    orderId = '',
    totalAmount = 0,
    totalItems = 0,
  } = location.state || {};

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/', { replace: true });
  };

  return (
    <div className="order-result">
      <header className="order-result__header">
        <div className="order-result__header-inner">
          <Link to="/" className="order-result__logo">
            JJShopping
          </Link>
          <div className="order-result__header-actions">
            {user && <UserMenu user={user} onLogout={handleLogout} />}
            <CartIconLink enabled={Boolean(user)} />
          </div>
        </div>
      </header>

      <main className="order-result__main">
        <div className="order-result__card">
          <div className="order-result__badge order-result__badge--success" aria-hidden="true">
            ✓
          </div>
          <h1>주문이 완료되었습니다</h1>
          <p className="order-result__desc">
            결제가 정상적으로 처리되었습니다.
            <br />
            주문 내역은 주문 목록에서 확인하실 수 있습니다.
          </p>

          {(orderId || totalAmount > 0 || totalItems > 0) && (
            <div className="order-result__info">
              {orderId && (
                <div className="order-result__info-row">
                  <span>주문번호</span>
                  <strong>{orderId}</strong>
                </div>
              )}
              {totalItems > 0 && (
                <div className="order-result__info-row">
                  <span>주문 수량</span>
                  <strong>{totalItems}개</strong>
                </div>
              )}
              {totalAmount > 0 && (
                <div className="order-result__info-row order-result__info-row--total">
                  <span>결제 금액</span>
                  <strong>{Number(totalAmount).toLocaleString()}원</strong>
                </div>
              )}
            </div>
          )}

          <div className="order-result__actions">
            <Link to="/orders" className="order-result__btn order-result__btn--primary">
              주문 목록 보기
            </Link>
            <Link to="/" className="order-result__btn order-result__btn--secondary">
              쇼핑 계속하기
            </Link>
            <Link to="/cart" className="order-result__btn order-result__btn--secondary">
              장바구니
            </Link>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}

export default OrderSuccess;
