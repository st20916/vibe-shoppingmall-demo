import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, updateOrder } from '../../api/orderApi';
import CancelReasonModal from '../../components/CancelReasonModal';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import './OrderList.css';

const STATUS_LABEL = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipping: '배송중',
  delivered: '배송 완료',
  cancelled: '취소됨',
};

const ORDER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: STATUS_LABEL.pending },
  { id: 'paid', label: STATUS_LABEL.paid },
  { id: 'preparing', label: STATUS_LABEL.preparing },
  { id: 'shipping', label: STATUS_LABEL.shipping },
  { id: 'delivered', label: STATUS_LABEL.delivered },
  { id: 'cancelled', label: STATUS_LABEL.cancelled },
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function OrderList() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [cancelModal, setCancelModal] = useState(null);

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

    const loadOrders = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await getOrders({
          status: activeTab === 'all' ? undefined : activeTab,
        });
        if (!cancelled) {
          setOrders(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '주문 목록을 불러오지 못했습니다.');
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user, activeTab]);

  const openCancelModal = (order) => {
    setError('');
    setCancelModal({
      orderId: order._id,
      orderLabel: order.order_id,
    });
  };

  const handleConfirmCancel = async (cancelReason) => {
    if (!cancelModal) return;

    setPendingId(cancelModal.orderId);
    setError('');

    try {
      const result = await updateOrder(cancelModal.orderId, {
        status: 'cancelled',
        cancelReason,
      });
      setOrders((prev) => {
        if (activeTab !== 'all' && activeTab !== 'cancelled') {
          return prev.filter((order) => order._id !== cancelModal.orderId);
        }
        return prev.map((order) =>
          order._id === cancelModal.orderId ? result.data : order
        );
      });
      setCancelModal(null);
    } catch (err) {
      throw err;
    } finally {
      setPendingId('');
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="order-list-page order-list-page--status">
        <p>확인 중...</p>
      </div>
    );
  }

  const emptyMessage =
    activeTab === 'all'
      ? '주문 내역이 없습니다.'
      : `${STATUS_LABEL[activeTab] || activeTab} 주문이 없습니다.`;

  return (
    <div className="order-list-page">
      <header className="order-list-page__header">
        <div className="order-list-page__header-inner">
          <Link to="/" className="order-list-page__logo">
            JJShopping
          </Link>
          <div className="order-list-page__header-actions">
            <UserMenu user={user} onLogout={handleLogout} />
            <CartIconLink enabled={Boolean(user)} />
          </div>
        </div>
      </header>

      <main className="order-list-page__main">
        <div className="order-list-page__title-row">
          <h1>주문 목록</h1>
          <Link to="/" className="order-list-page__shop-link">
            쇼핑 계속하기
          </Link>
        </div>

        <div className="order-list-page__tabs" role="tablist" aria-label="주문 상태">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={
                activeTab === tab.id
                  ? 'order-list-page__tab order-list-page__tab--active'
                  : 'order-list-page__tab'
              }
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="order-list-page__error" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="order-list-page__empty">
            <p>주문 목록을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="order-list-page__empty">
            <p>{emptyMessage}</p>
            {activeTab === 'all' && (
              <Link to="/" className="order-list-page__shop-btn">
                쇼핑하러 가기
              </Link>
            )}
          </div>
        ) : (
          <ul className="order-list-page__list">
            {orders.map((order) => {
              const firstItem = order.items?.[0];
              const extraCount = Math.max((order.items?.length || 0) - 1, 0);
              const summaryName = firstItem?.name
                ? extraCount > 0
                  ? `${firstItem.name} 외 ${extraCount}건`
                  : firstItem.name
                : '주문 상품';
              const canCancel = order.status === 'pending' || order.status === 'paid';

              return (
                <li key={order._id || order.order_id} className="order-list-page__card">
                  <div className="order-list-page__card-head">
                    <div>
                      <p className="order-list-page__order-id">{order.order_id}</p>
                      <p className="order-list-page__date">{formatDate(order.createdAt)}</p>
                    </div>
                    <span
                      className={`order-list-page__status order-list-page__status--${order.status}`}
                    >
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>

                  <div className="order-list-page__card-body">
                    <div className="order-list-page__thumb">
                      {firstItem?.image ? (
                        <img src={firstItem.image} alt={summaryName} />
                      ) : (
                        <div className="order-list-page__thumb--empty" aria-hidden="true" />
                      )}
                    </div>
                    <div className="order-list-page__info">
                      <p className="order-list-page__name">{summaryName}</p>
                      <p className="order-list-page__meta">
                        총 {order.totalItems}개 ·{' '}
                        {Number(order.totalAmount || 0).toLocaleString()}원
                      </p>
                      {order.status === 'cancelled' && order.cancelReason && (
                        <p className="order-list-page__cancel-reason">
                          취소 사유: {order.cancelReason}
                        </p>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="order-list-page__cancel-btn"
                          disabled={pendingId === order._id}
                          onClick={() => openCancelModal(order)}
                        >
                          {pendingId === order._id ? '취소 중...' : '주문 취소'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <HomeFooter />

      {cancelModal && (
        <CancelReasonModal
          orderLabel={cancelModal.orderLabel}
          isSubmitting={pendingId === cancelModal.orderId}
          onClose={() => {
            if (pendingId === cancelModal.orderId) return;
            setCancelModal(null);
          }}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}

export default OrderList;
