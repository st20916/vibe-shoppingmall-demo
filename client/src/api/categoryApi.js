const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/categories`;

const parseCategoryErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';
  if (message.includes('name is required')) return '카테고리명을 입력해주세요.';
  if (message.includes('name already exists')) return '이미 사용 중인 카테고리명입니다.';
  if (message.includes('Category not found')) return '카테고리를 찾을 수 없습니다.';
  if (message.includes('Invalid category id')) return '올바르지 않은 카테고리 ID입니다.';
  if (message.includes('cannot be deleted')) {
    return '기본 카테고리(상의, 하의, 악세서리)는 삭제할 수 없습니다.';
  }
  if (message.includes('in use by products')) {
    return '상품에서 사용 중인 카테고리는 삭제할 수 없습니다.';
  }
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
    throw new Error(parseCategoryErrorMessage(result.message));
  }

  return result;
};

export const getCategories = async () => request(API_BASE_URL);

export const getCategoryById = async (id) => request(`${API_BASE_URL}/${id}`);

export const createCategory = async ({ name }) =>
  request(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const updateCategory = async (id, { name }) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });

export const deleteCategory = async (id) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
