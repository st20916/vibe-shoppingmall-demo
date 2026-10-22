import { getToken } from '../utils/authStorage';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/search`;

const parseSearchErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';
  if (message.includes('q is required')) return '검색어를 입력해주세요.';
  if (message.includes('Authentication required')) return '로그인이 필요합니다.';
  if (message.includes('Invalid or expired token')) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  if (message.includes('Access denied')) return '접근 권한이 없습니다.';
  if (message.includes('Search history not found')) return '검색 기록을 찾을 수 없습니다.';
  return message;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(parseSearchErrorMessage(result.message));
  }

  return result;
};

const authHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
  return { Authorization: `Bearer ${token}` };
};

/** 상품 검색. 로그인 상태면 검색 기록이 자동으로 저장된다. */
export const searchProducts = async ({ q, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  params.set('q', q || '');
  params.set('page', String(page));
  params.set('limit', String(limit));

  const token = getToken();

  return request(`${API_BASE_URL}?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

/** 인기 검색어 TOP 10 (로그인 불필요) */
export const getPopularKeywords = async () => request(`${API_BASE_URL}/popular`);

/** 내 최근 검색어 목록 (로그인 필요) */
export const getSearchHistory = async () =>
  request(`${API_BASE_URL}/history`, { headers: authHeaders() });

/** 검색 기록 1건 삭제 (로그인 필요) */
export const deleteSearchHistoryItem = async (id) =>
  request(`${API_BASE_URL}/history/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

/** 검색 기록 전체 삭제 (로그인 필요) */
export const clearSearchHistory = async () =>
  request(`${API_BASE_URL}/history`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
