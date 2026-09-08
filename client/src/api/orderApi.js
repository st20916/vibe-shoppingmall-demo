import { getToken } from '../utils/authStorage';
import { notifyCartUpdated } from './cartApi';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/orders`;

const parseOrderErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';
  if (message.includes('Authentication required')) return '로그인이 필요합니다.';
  if (message.includes('Invalid or expired token')) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  if (message.includes('Cart is empty')) return '장바구니가 비어 있습니다.';
  if (message.includes('Product not found')) return '주문할 상품을 찾을 수 없습니다.';
  if (message.includes('Order not found')) return '주문을 찾을 수 없습니다.';
  if (message.includes('Access denied')) return '접근 권한이 없습니다.';
  if (message.includes('imp_uid and merchant_uid are required')) {
    return '결제 정보가 없습니다. 다시 결제를 진행해주세요.';
  }
  if (message.includes('Order already exists for this payment')) {
    return '이미 처리된 결제입니다.';
  }
  if (message.includes('Payment is not paid')) return '결제가 완료되지 않았습니다.';
  if (message.includes('Payment amount mismatch')) {
    return '결제 금액이 주문 금액과 일치하지 않습니다.';
  }
  if (message.includes('Payment merchant_uid mismatch')) {
    return '결제 주문번호가 일치하지 않습니다.';
  }
  if (message.includes('PORTONE_API_KEY') || message.includes('PORTONE_API_SECRET')) {
    return '결제 검증 설정이 완료되지 않았습니다.';
  }
  if (message.includes('Failed to get PortOne')) {
    return '결제 검증에 실패했습니다. 잠시 후 다시 시도해주세요.';
  }
  if (message.includes('cancelReason is required')) {
    return '주문 취소 사유를 입력해주세요.';
  }
  if (message.includes('Only pending or paid orders can be cancelled')) {
    return '결제 대기/결제 완료 주문만 취소할 수 있습니다.';
  }
  if (message.includes('Only cancelled status is allowed')) {
    return '주문 취소만 가능합니다.';
  }
  return message;
};

const authHeaders = (accessToken) => {
  const token = accessToken || getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const request = async (url, options = {}, accessToken) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(accessToken),
      ...options.headers,
    },
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(parseOrderErrorMessage(result.message));
  }

  return result;
};

export const getOrders = async ({ status } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString();
  return request(query ? `${API_BASE_URL}?${query}` : API_BASE_URL);
};

export const getAdminOrders = async ({ status } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const query = params.toString();
  return request(query ? `${API_BASE_URL}/admin?${query}` : `${API_BASE_URL}/admin`);
};

export const getOrderById = async (id) => request(`${API_BASE_URL}/${id}`);

export const createOrder = async ({ imp_uid, merchant_uid }, accessToken) => {
  const token = accessToken || getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  // Authorization을 명시적으로 고정해 결제 콜백 환경에서도 누락되지 않게 함
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imp_uid, merchant_uid }),
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(parseOrderErrorMessage(result.message));
  }

  notifyCartUpdated();
  return result;
};

export const updateOrder = async (id, { status, cancelReason } = {}) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      status,
      ...(cancelReason !== undefined ? { cancelReason } : {}),
    }),
  });

export const deleteOrder = async (id) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
