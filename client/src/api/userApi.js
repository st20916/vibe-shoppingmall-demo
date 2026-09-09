const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/users`;

const parseErrorMessage = (message) => {
  if (!message) return '회원가입에 실패했습니다.';

  if (message.includes('user_id already exists')) return '이미 사용 중인 아이디입니다.';
  if (message.includes('email already exists')) return '이미 사용 중인 이메일입니다.';
  if (message.includes('user_id is required')) return '아이디를 입력해주세요.';
  if (message.includes('name is required')) return '이름을 입력해주세요.';
  if (message.includes('email is required')) return '이메일을 입력해주세요.';
  if (message.includes('password is required')) return '비밀번호를 입력해주세요.';
  if (message.includes('user_type must be')) return '회원 유형이 올바르지 않습니다.';

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
    throw new Error(parseErrorMessage(result.message));
  }

  return result;
};

// GET /api/users/count — 총 회원 수 조회
export const getUserCount = async ({ user_type } = {}) => {
  const params = new URLSearchParams();
  if (user_type) params.set('user_type', user_type);
  const query = params.toString();
  return request(query ? `${API_BASE_URL}/count?${query}` : `${API_BASE_URL}/count`);
};

// POST /api/users — 회원가입 (userController.createUser)
export const createUser = async (userData) =>
  request(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
