import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearCartItems,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../../api/cartApi';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import './Cart.css';

const getItemProductId = (item) => {
  if (!item?.product) return '';
  return typeof item.product === 'object' && item.product._id
    ? String(item.product._id)
    : String(item.product);
};

function Cart() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/', { replace: true });
  };
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    const loadCart = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await getCart();
        if (!cancelled) {
          setCart(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '장바구니를 불러오지 못했습니다.');
          setCart(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) return;

    setPendingId(productId);
    setError('');

    try {
      const result = await updateCartItem(productId, quantity);
      setCart(result.data);
    } catch (err) {
      setError(err.message || '수량 변경에 실패했습니다.');
    } finally {
      setPendingId('');
    }
  };

  const handleRemove = async (productId) => {
    setPendingId(productId);
    setError('');

    try {
      const result = await removeCartItem(productId);
      setCart(result.data);
    } catch (err) {
      setError(err.message || '상품 삭제에 실패했습니다.');
    } finally {
      setPendingId('');
    }
  };

  const handleClear = async () => {
    const confirmed = window.confirm('장바구니를 모두 비울까요?');
    if (!confirmed) return;

    setPendingId('clear');
    setError('');

    try {
      const result = await clearCartItems();
      setCart(result.data);
    } catch (err) {
      setError(err.message || '장바구니 비우기에 실패했습니다.');
    } finally {
      setPendingId('');
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="cart-page cart-page--status">
        <p>확인 중...</p>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="cart-page">
      <header className="cart-page__header">
        <div className="cart-page__header-inner">
          <Link to="/" className="cart-page__logo">
            JJShopping
          </Link>
          <div className="cart-page__header-actions">
            <UserMenu user={user} onLogout={handleLogout} />
            <CartIconLink enabled={Boolean(user)} />
          </div>
        </div>
      </header>

      <main className="cart-page__main">
        <div className="cart-page__title-row">
          <h1>장바구니</h1>
          {items.length > 0 && (
            <button
              type="button"
              className="cart-page__clear"
              onClick={handleClear}
              disabled={pendingId === 'clear'}
            >
              전체 삭제
            </button>
          )}
        </div>

        {error && (
          <p className="cart-page__error" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="cart-page__empty">
            <p>장바구니를 불러오는 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-page__empty">
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/" className="cart-page__shop-btn">
              쇼핑 계속하기
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-page__list">
              {items.map((item) => {
                const product = item.product || {};
                const productId = getItemProductId(item);
                const name = product.name || '상품';
                const image = product.image || '';
                const unitPrice = item.price ?? product.price ?? 0;
                const lineTotal = unitPrice * item.quantity;
                const isPending = pendingId === productId;

                return (
                  <li key={productId} className="cart-page__item">
                    <Link to={`/products/${productId}`} className="cart-page__thumb">
                      {image ? (
                        <img src={image} alt={name} />
                      ) : (
                        <div className="cart-page__thumb--empty" aria-hidden="true" />
                      )}
                    </Link>
                    <div className="cart-page__info">
                      <p className="cart-page__category">{product.category || ''}</p>
                      <Link to={`/products/${productId}`} className="cart-page__name">
                        {name}
                      </Link>
                      <p className="cart-page__unit">
                        {Number(unitPrice).toLocaleString()}원
                      </p>
                      <div className="cart-page__qty">
                        <button
                          type="button"
                          disabled={isPending || item.quantity <= 1}
                          onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <em>{item.quantity}</em>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-page__side">
                      <strong>{Number(lineTotal).toLocaleString()}원</strong>
                      <button
                        type="button"
                        className="cart-page__remove"
                        disabled={isPending}
                        onClick={() => handleRemove(productId)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="cart-page__summary">
              <div className="cart-page__summary-row">
                <span>총 수량</span>
                <strong>{cart.totalItems}개</strong>
              </div>
              <div className="cart-page__summary-row cart-page__summary-row--total">
                <span>결제 예정 금액</span>
                <strong>{Number(cart.totalAmount).toLocaleString()}원</strong>
              </div>
              <button
                type="button"
                className="cart-page__checkout"
                onClick={() => navigate('/order')}
              >
                주문하기
              </button>
              <Link to="/" className="cart-page__continue">
                쇼핑 계속하기
              </Link>
            </aside>
          </>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}

export default Cart;
