import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import './OrderResult.css';

function OrderFail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    message = '주문 처리 중 문제가 발생했습니다.',
    stage = 'order',
  } = location.state || {};

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/', { replace: true });
  };

  const title =
    stage === 'payment' ? '결제에 실패했습니다' : '주문 처리에 실패했습니다';
  const desc =
    stage === 'payment'
      ? '결제가 완료되지 않았거나 취소되었습니다. 다시 시도해 주세요.'
      : '결제는 진행되었을 수 있습니다. 문제가 계속되면 고객센터로 문의해 주세요.';

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
          <div className="order-result__badge order-result__badge--fail" aria-hidden="true">
            !
          </div>
          <h1>{title}</h1>
          <p className="order-result__desc">{desc}</p>

          <p className="order-result__message" role="alert">
            {message}
          </p>

          <div className="order-result__actions">
            <Link to="/order" className="order-result__btn order-result__btn--primary">
              다시 결제하기
            </Link>
            <Link to="/cart" className="order-result__btn order-result__btn--secondary">
              장바구니로
            </Link>
            <Link to="/" className="order-result__btn order-result__btn--secondary">
              홈으로
            </Link>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}

export default OrderFail;
