const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/products`;

const parseProductErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';
  if (message.includes('product_id already exists')) return '이미 사용 중인 상품 아이디입니다.';
  if (message.includes('product_id is required')) return '상품 아이디를 입력해주세요.';
  if (message.includes('name is required')) return '상품 이름을 입력해주세요.';
  if (message.includes('price is required')) return '상품 가격을 입력해주세요.';
  if (message.includes('category must be')) return '카테고리는 상의, 하의, 악세서리 중 하나여야 합니다.';
  if (message.includes('category does not exist')) return '존재하지 않는 카테고리입니다.';
  if (message.includes('category is required')) return '상품 카테고리를 선택해주세요.';
  if (message.includes('image is required')) return '상품 이미지를 입력해주세요.';
  if (message.includes('price must be')) return '가격은 0 이상이어야 합니다.';
  if (message.includes('Delete confirmation is required')) {
    return '삭제를 확인해주세요.';
  }
  if (message.includes('product_id is required for delete verification')) {
    return '삭제 검증을 위해 상품 아이디가 필요합니다.';
  }
  if (message.includes('product_id does not match')) {
    return '상품 아이디가 일치하지 않아 삭제할 수 없습니다.';
  }
  if (message.includes('Product not found')) return '상품을 찾을 수 없습니다.';
  if (message.includes('Invalid product id')) return '올바르지 않은 상품 ID입니다.';
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
    throw new Error(parseProductErrorMessage(result.message));
  }

  return result;
};

export const getProducts = async ({ page = 1, limit = 10, category, q } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (category) params.set('category', category);
  if (q) params.set('q', q);

  return request(`${API_BASE_URL}?${params.toString()}`);
};

/** 메인 페이지용: 전체 상품 (product_id, description 제외) */
export const getPublicProducts = async () => request(`${API_BASE_URL}/public`);

/** 상품 상세 조회 (MongoDB _id) */
export const getProductById = async (id) => request(`${API_BASE_URL}/${id}`);

export const createProduct = async (productData) =>
  request(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(productData),
  });

export const updateProduct = async (id, productData) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });

export const deleteProduct = async (id, { confirm = true, product_id } = {}) =>
  request(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirm, product_id }),
  });
