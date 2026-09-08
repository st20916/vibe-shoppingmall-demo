import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart } from '../../api/cartApi';
import { createOrder } from '../../api/orderApi';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../hooks/useAuth';
import { getToken } from '../../utils/authStorage';
import HomeFooter from '../Home/HomeFooter';
import './Order.css';

const DELIVERY_REQUESTS = [
  '배송 요청사항을 선택해 주세요.',
  '문 앞에 놓아주세요.',
  '경비실에 맡겨주세요.',
  '배송 전 연락 바랍니다.',
  '부재 시 연락주세요.',
];

const PAYMENT_METHODS = [
  { id: 'card', label: '신용/체크카드' },
  { id: 'account', label: '계좌이체' },
  { id: 'general', label: '일반결제' },
];

const PORTONE_IMP_CODE = import.meta.env.VITE_PORTONE_IMP_CODE;
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
const ORDER_ACCESS_TOKEN_KEY = 'order_access_token';
const ORDER_PENDING_META_KEY = 'order_pending_meta';

const PAY_METHOD_MAP = {
  card: 'card',
  account: 'trans',
  general: 'card',
};

const getItemProductId = (item) => {
  if (!item?.product) return '';
  return typeof item.product === 'object' && item.product._id
    ? String(item.product._id)
    : String(item.product);
};

const getItemName = (item) => {
  if (!item) return '상품';
  if (typeof item.product === 'object' && item.product?.name) {
    return item.product.name;
  }
  return item.name || '상품';
};

function Order() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryRequest, setDeliveryRequest] = useState(DELIVERY_REQUESTS[0]);
  const [pointInput, setPointInput] = useState('0');
  const paymentReturnHandled = useRef(false);

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/', { replace: true });
  };

  const resolveAccessToken = () =>
    getToken() || sessionStorage.getItem(ORDER_ACCESS_TOKEN_KEY) || '';

  const clearPaymentSession = () => {
    sessionStorage.removeItem(ORDER_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ORDER_PENDING_META_KEY);
  };

  const completeOrderAfterPayment = async ({
    impUid,
    merchantUid,
    accessToken,
    amount,
    totalItems,
  }) => {
    const result = await createOrder(
      {
        imp_uid: impUid,
        merchant_uid: merchantUid,
      },
      accessToken
    );

    clearPaymentSession();

    navigate('/order/success', {
      replace: true,
      state: {
        orderId: result.data?.order_id || merchantUid || '',
        totalAmount: result.data?.totalAmount ?? amount ?? 0,
        totalItems: result.data?.totalItems ?? totalItems ?? 0,
      },
    });
  };

  // 포트원(I'mport) 결제 모듈 초기화
  useEffect(() => {
    const { IMP } = window;
    if (!IMP) {
      console.error('포트원 결제 모듈을 불러오지 못했습니다.');
      return;
    }
    if (PORTONE_IMP_CODE) {
      IMP.init(PORTONE_IMP_CODE);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  // 모바일 등 결제 후 리다이렉트 복귀 처리 (?imp_uid=&merchant_uid=)
  useEffect(() => {
    if (paymentReturnHandled.current || isAuthLoading || !user) return;

    const params = new URLSearchParams(window.location.search);
    const impUid = params.get('imp_uid');
    const merchantUid = params.get('merchant_uid');
    const impSuccess = params.get('imp_success');
    const errorMsg = params.get('error_msg');

    if (!impUid && !merchantUid && impSuccess === null) return;

    paymentReturnHandled.current = true;
    window.history.replaceState({}, '', '/order');

    const finishReturn = async () => {
      if (impSuccess === 'false') {
        clearPaymentSession();
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'payment',
            message: errorMsg || '결제에 실패했습니다.',
          },
        });
        return;
      }

      if (!impUid || !merchantUid) {
        clearPaymentSession();
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'payment',
            message: errorMsg || '결제 정보가 올바르지 않습니다.',
          },
        });
        return;
      }

      const accessToken = resolveAccessToken();
      if (!accessToken) {
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'order',
            message: '로그인이 필요합니다. 다시 로그인 후 결제를 진행해주세요.',
          },
        });
        return;
      }

      let meta = {};
      try {
        meta = JSON.parse(sessionStorage.getItem(ORDER_PENDING_META_KEY) || '{}');
      } catch {
        meta = {};
      }

      setIsSubmitting(true);
      try {
        await completeOrderAfterPayment({
          impUid,
          merchantUid,
          accessToken,
          amount: meta.amount,
          totalItems: meta.totalItems,
        });
      } catch (err) {
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'order',
            message:
              err.message ||
              '결제는 완료되었으나 주문 저장에 실패했습니다. 고객센터로 문의해 주세요.',
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    finishReturn();
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    const loadCart = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await getCart();
        if (cancelled) return;

        if (!result.data?.items?.length) {
          alert('장바구니가 비어 있습니다.');
          navigate('/cart', { replace: true });
          return;
        }

        setCart(result.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '주문 정보를 불러오지 못했습니다.');
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
  }, [user, navigate]);

  const handleSubmit = () => {
    if (!agreed) {
      alert('주문 내용 확인 및 결제 진행에 동의해 주세요.');
      return;
    }

    const accessToken = getToken();
    if (!accessToken) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate('/login', { replace: true });
      return;
    }

    const { IMP } = window;
    if (!IMP) {
      setError('포트원 결제 모듈을 불러오지 못했습니다.');
      return;
    }

    const items = cart?.items || [];
    if (!items.length) {
      setError('주문할 상품이 없습니다.');
      return;
    }

    const amount = Number(cart?.totalAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('결제 금액이 올바르지 않습니다.');
      return;
    }

    const firstName = getItemName(items[0]);
    const orderName =
      items.length > 1 ? `${firstName} 외 ${items.length - 1}건` : firstName;
    const totalItems = cart?.totalItems || 0;

    // 결제 팝업/리다이렉트 동안 토큰이 유실되지 않도록 백업
    sessionStorage.setItem(ORDER_ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(
      ORDER_PENDING_META_KEY,
      JSON.stringify({ amount, totalItems })
    );

    setIsSubmitting(true);
    setError('');

    const payParams = {
      ...(PORTONE_CHANNEL_KEY
        ? { channelKey: PORTONE_CHANNEL_KEY }
        : { pg: 'html5_inicis' }),
      pay_method: PAY_METHOD_MAP[paymentMethod] || 'card',
      merchant_uid: `ORD${Date.now()}`,
      name: orderName,
      amount,
      buyer_email: user.email || '',
      buyer_name: user.name || '',
      buyer_tel: '010-0000-0000',
      buyer_addr: user.address || '',
      m_redirect_url: `${window.location.origin}/order`,
    };

    IMP.request_pay(payParams, async (rsp) => {
      if (!rsp.success) {
        clearPaymentSession();
        setIsSubmitting(false);
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'payment',
            message: rsp.error_msg || '결제에 실패했습니다.',
          },
        });
        return;
      }

      try {
        const token = resolveAccessToken() || accessToken;
        await completeOrderAfterPayment({
          impUid: rsp.imp_uid,
          merchantUid: rsp.merchant_uid,
          accessToken: token,
          amount,
          totalItems,
        });
      } catch (err) {
        navigate('/order/fail', {
          replace: true,
          state: {
            stage: 'order',
            message:
              err.message ||
              '결제는 완료되었으나 주문 저장에 실패했습니다. 고객센터로 문의해 주세요.',
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  if (isAuthLoading || !user) {
    return (
      <div className="order-page order-page--status">
        <p>확인 중...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="order-page order-page--status">
        <p>주문 정보를 불러오는 중...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const orderAmount = Number(cart?.totalAmount || 0);
  const discountAmount = 0;
  const payAmount = orderAmount - discountAmount;
  const totalItems = cart?.totalItems || 0;

  return (
    <div className="order-page">
      <header className="order-page__header">
        <div className="order-page__header-inner">
          <Link to="/" className="order-page__logo">
            JJShopping
          </Link>
          <div className="order-page__header-actions">
            <UserMenu user={user} onLogout={handleLogout} />
            <CartIconLink enabled={Boolean(user)} />
          </div>
        </div>
      </header>

      <main className="order-page__main">
        <h1 className="order-page__title">결제하기</h1>

        <p className="order-page__notice">
          장바구니에 담긴 상품으로 주문을 진행합니다. 결제 완료 후 장바구니는 자동으로 비워집니다.
        </p>

        {error && (
          <p className="order-page__error" role="alert">
            {error}
          </p>
        )}

        <div className="order-page__layout">
          <div className="order-page__content">
            <section className="order-page__section">
              <div className="order-page__section-head">
                <h2>받는 분 정보</h2>
                <Link to="/cart" className="order-page__link-btn">
                  장바구니로
                </Link>
              </div>
              <dl className="order-page__info-list">
                <div>
                  <dt>받는 분</dt>
                  <dd>{user.name}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{user.address || '등록된 주소가 없습니다.'}</dd>
                </div>
              </dl>
              <label className="order-page__field">
                <span>배송 요청사항</span>
                <select
                  value={deliveryRequest}
                  onChange={(e) => setDeliveryRequest(e.target.value)}
                >
                  {DELIVERY_REQUESTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="order-page__section">
              <h2>주문상품 : {totalItems}개</h2>
              <ul className="order-page__items">
                {items.map((item) => {
                  const product = item.product || {};
                  const productId = getItemProductId(item);
                  const name = product.name || '상품';
                  const image = product.image || '';
                  const unitPrice = item.price ?? product.price ?? 0;
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <li key={productId} className="order-page__item">
                      <div className="order-page__thumb">
                        {image ? (
                          <img src={image} alt={name} />
                        ) : (
                          <div className="order-page__thumb--empty" aria-hidden="true" />
                        )}
                      </div>
                      <div className="order-page__item-body">
                        <p className="order-page__item-name">{name}</p>
                        <p className="order-page__item-meta">
                          {product.category || '상품'} · 수량 {item.quantity}개
                        </p>
                        <p className="order-page__item-price">
                          {Number(lineTotal).toLocaleString()}원
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="order-page__section">
              <h2>할인혜택</h2>
              <div className="order-page__row">
                <span>상품금액</span>
                <strong>{orderAmount.toLocaleString()}원</strong>
              </div>
              <div className="order-page__row">
                <span>즉시할인금액</span>
                <strong className="order-page__muted">
                  -{discountAmount.toLocaleString()}원
                </strong>
              </div>
              <label className="order-page__check">
                <input type="checkbox" disabled />
                <span>적용 가능한 쿠폰이 없습니다.</span>
              </label>
            </section>

            <section className="order-page__section">
              <h2>포인트 사용</h2>
              <div className="order-page__point">
                <label>
                  <span>사용 포인트</span>
                  <div className="order-page__point-input">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pointInput}
                      onChange={(e) =>
                        setPointInput(e.target.value.replace(/[^\d]/g, '') || '0')
                      }
                    />
                    <em>원</em>
                    <button type="button" onClick={() => setPointInput('0')}>
                      전액사용
                    </button>
                  </div>
                </label>
                <p className="order-page__hint">보유 포인트 0원</p>
              </div>
            </section>

            <section className="order-page__section">
              <h2>결제방법</h2>
              <div className="order-page__pay-tabs" role="radiogroup" aria-label="결제방법">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === method.id}
                    className={
                      paymentMethod === method.id
                        ? 'order-page__pay-tab order-page__pay-tab--active'
                        : 'order-page__pay-tab'
                    }
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
              <div className="order-page__card-box">
                <div className="order-page__card-visual" aria-hidden="true">
                  <span>JJ CARD</span>
                  <em>**** **** **** 1234</em>
                </div>
                <p>
                  {paymentMethod === 'card' && '등록된 카드로 결제를 진행합니다.'}
                  {paymentMethod === 'account' && '계좌이체로 결제를 진행합니다.'}
                  {paymentMethod === 'general' && '일반결제로 결제를 진행합니다.'}
                </p>
              </div>
            </section>

            <section className="order-page__section order-page__section--agree">
              <label className="order-page__check">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>주문 내용을 확인하였으며, 정보 제공 등에 동의합니다.</span>
              </label>
              <button
                type="button"
                className="order-page__pay-btn order-page__pay-btn--full"
                disabled={isSubmitting || items.length === 0}
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? '결제 처리 중...'
                  : `동의하고 ${payAmount.toLocaleString()}원 결제하기`}
              </button>
            </section>
          </div>

          <aside className="order-page__summary">
            <div className="order-page__summary-box">
              <h2>결제정보</h2>
              <div className="order-page__row">
                <span>주문금액</span>
                <strong>{orderAmount.toLocaleString()}원</strong>
              </div>
              <div className="order-page__row">
                <span>할인금액</span>
                <strong className="order-page__muted">
                  -{discountAmount.toLocaleString()}원
                </strong>
              </div>
              <div className="order-page__summary-total">
                <span>최종 결제금액</span>
                <strong>{payAmount.toLocaleString()}원</strong>
              </div>
              <button
                type="button"
                className="order-page__pay-btn"
                disabled={isSubmitting || items.length === 0}
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? '결제 처리 중...'
                  : `${payAmount.toLocaleString()}원 결제하기`}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}

export default Order;
