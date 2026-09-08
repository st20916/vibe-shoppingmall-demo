import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminOrders, updateOrder } from '../../../api/orderApi';
import CancelReasonModal from '../../../components/CancelReasonModal';
import { useAuth } from '../../../hooks/useAuth';
import HomeFooter from '../../Home/HomeFooter';
import AdminHeader from '../AdminHeader';
import AdminSidebar from '../AdminSidebar';
import '../Admin.css';
import './OrderManage.css';

const STATUS_LABEL = {
  pending: '결제 대기',
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipping: '배송중',
  delivered: '배송 완료',
  cancelled: '취소됨',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

const ORDER_TABS = [
  { id: 'all', label: '전체' },
  ...STATUS_OPTIONS.map((id) => ({ id, label: STATUS_LABEL[id] })),
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

const getBuyerName = (order) => {
  if (order.user && typeof order.user === 'object') {
    return order.user.name || order.user.user_id || '-';
  }
  return '-';
};

const getBuyerEmail = (order) => {
  if (order.user && typeof order.user === 'object') {
    return order.user.email || '-';
  }
  return '-';
};

const getSummaryName = (order) => {
  const firstItem = order.items?.[0];
  const extraCount = Math.max((order.items?.length || 0) - 1, 0);
  if (!firstItem?.name) return '주문 상품';
  return extraCount > 0 ? `${firstItem.name} 외 ${extraCount}건` : firstItem.name;
};

function OrderManage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModal, setCancelModal] = useState(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !isAdmin) {
      alert('Admin 권한이 필요합니다.');
      navigate(user ? '/' : '/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    let cancelled = false;

    const loadOrders = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await getAdminOrders({
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
          setIsFetching(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, activeTab]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      const orderId = String(order.order_id || '').toLowerCase();
      const buyerName = getBuyerName(order).toLowerCase();
      const buyerEmail = getBuyerEmail(order).toLowerCase();
      const productName = getSummaryName(order).toLowerCase();
      return (
        orderId.includes(q) ||
        buyerName.includes(q) ||
        buyerEmail.includes(q) ||
        productName.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const applyOrderUpdate = (orderId, updatedOrder) => {
    setOrders((prev) => {
      const next = prev.map((order) => (order._id === orderId ? updatedOrder : order));
      if (activeTab !== 'all' && updatedOrder?.status !== activeTab) {
        return next.filter((order) => order._id !== orderId);
      }
      return next;
    });
  };

  const submitStatusChange = async (orderId, nextStatus, cancelReason) => {
    setPendingId(orderId);
    setError('');

    try {
      const result = await updateOrder(orderId, { status: nextStatus, cancelReason });
      applyOrderUpdate(orderId, result.data);
      setCancelModal(null);
    } catch (err) {
      if (nextStatus !== 'cancelled') {
        setError(err.message || '주문 상태 변경에 실패했습니다.');
      }
      throw err;
    } finally {
      setPendingId('');
    }
  };

  const handleStatusChange = (orderId, nextStatus, orderLabel) => {
    if (nextStatus === 'cancelled') {
      setCancelModal({ orderId, orderLabel });
      return;
    }

    submitStatusChange(orderId, nextStatus).catch(() => {});
  };

  const handleConfirmCancel = async (cancelReason) => {
    if (!cancelModal) return;
    await submitStatusChange(cancelModal.orderId, 'cancelled', cancelReason);
  };

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
          <div className="order-manage__top">
            <div>
              <p className="order-manage__eyebrow">ORDER MANAGEMENT</p>
              <h1 className="order-manage__title">주문/배송 조회</h1>
              <p className="order-manage__desc">
                전체 주문을 조회하고 배송 상태를 변경할 수 있습니다.
              </p>
            </div>
            <Link to="/admin" className="order-manage__back">
              ← Admin 대시보드
            </Link>
          </div>

          <div className="order-manage__summary">
            <div className="order-manage__summary-card">
              <span>조회 건수</span>
              <strong>{filteredOrders.length}</strong>
            </div>
            <div className="order-manage__summary-card">
              <span>전체 로드</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="order-manage__summary-card">
              <span>현재 필터</span>
              <strong>
                {activeTab === 'all' ? '전체' : STATUS_LABEL[activeTab] || activeTab}
              </strong>
            </div>
          </div>

          <div className="order-manage__tabs" role="tablist" aria-label="주문 상태">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id
                    ? 'order-manage__tab is-active'
                    : 'order-manage__tab'
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="order-manage__panel">
            <div className="order-manage__toolbar">
              <label className="order-manage__search">
                <span className="visually-hidden">주문 검색</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="주문번호, 주문자, 상품명 검색"
                />
              </label>
            </div>

            {error && (
              <p className="order-manage__error" role="alert">
                {error}
              </p>
            )}

            {isFetching ? (
              <div className="admin-empty admin-empty--sm">
                <p>주문 목록을 불러오는 중...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="admin-empty">
                <p>표시할 주문이 없습니다.</p>
              </div>
            ) : (
              <div className="order-manage__table-wrap">
                <table className="order-manage__table">
                  <thead>
                    <tr>
                      <th>주문일시</th>
                      <th>주문번호</th>
                      <th>주문자</th>
                      <th>상품</th>
                      <th>수량</th>
                      <th>결제금액</th>
                      <th>상태</th>
                      <th>취소 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <span className="order-manage__order-id">{order.order_id}</span>
                        </td>
                        <td>
                          <div className="order-manage__buyer">
                            <strong>{getBuyerName(order)}</strong>
                            <span>{getBuyerEmail(order)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="order-manage__product">
                            {order.items?.[0]?.image ? (
                              <img
                                src={order.items[0].image}
                                alt=""
                                className="order-manage__thumb"
                              />
                            ) : (
                              <div className="order-manage__thumb order-manage__thumb--empty" />
                            )}
                            <span>{getSummaryName(order)}</span>
                          </div>
                        </td>
                        <td>{order.totalItems}개</td>
                        <td className="order-manage__amount">
                          {Number(order.totalAmount || 0).toLocaleString()}원
                        </td>
                        <td>
                          <select
                            className="order-manage__status-select"
                            value={order.status}
                            disabled={pendingId === order._id}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value, order.order_id)
                            }
                            aria-label={`${order.order_id} 상태 변경`}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="order-manage__cancel-reason">
                          {order.status === 'cancelled' && order.cancelReason
                            ? order.cancelReason
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

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

export default OrderManage;
