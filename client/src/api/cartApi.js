import { getToken } from '../utils/authStorage';

const API_BASE_URL = '/api/cart';

const parseCartErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';
  if (message.includes('Authentication required')) return '로그인이 필요합니다.';
  if (message.includes('Invalid or expired token')) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  if (message.includes('product is required')) return '상품을 선택해주세요.';
  if (message.includes('quantity must be')) return '수량은 1 이상의 정수여야 합니다.';
  if (message.includes('Product not found')) return '상품을 찾을 수 없습니다.';
  if (message.includes('Cart item not found')) return '장바구니에 해당 상품이 없습니다.';
  if (message.includes('Cart not found')) return '장바구니를 찾을 수 없습니다.';
  if (message.includes('items must be an array')) return '장바구니 형식이 올바르지 않습니다.';
  return message;
};

const authHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
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
    throw new Error(parseCartErrorMessage(result.message));
  }

  return result;
};

export const notifyCartUpdated = () => {
  window.dispatchEvent(new Event('cart-updated'));
};

export const getCart = async () => request(API_BASE_URL);

export const createCart = async () =>
  request(API_BASE_URL, {
    method: 'POST',
  });

export const updateCart = async (items) => {
  const result = await request(API_BASE_URL, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  notifyCartUpdated();
  return result;
};

export const deleteCart = async () => {
  const result = await request(API_BASE_URL, {
    method: 'DELETE',
  });
  notifyCartUpdated();
  return result;
};

export const addCartItem = async ({ product, quantity = 1 }) => {
  const result = await request(`${API_BASE_URL}/items`, {
    method: 'POST',
    body: JSON.stringify({ product, quantity }),
  });
  notifyCartUpdated();
  return result;
};

export const updateCartItem = async (productId, quantity) => {
  const result = await request(`${API_BASE_URL}/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
  notifyCartUpdated();
  return result;
};

export const removeCartItem = async (productId) => {
  const result = await request(`${API_BASE_URL}/items/${productId}`, {
    method: 'DELETE',
  });
  notifyCartUpdated();
  return result;
};

export const clearCartItems = async () => {
  const result = await request(`${API_BASE_URL}/items`, {
    method: 'DELETE',
  });
  notifyCartUpdated();
  return result;
};
