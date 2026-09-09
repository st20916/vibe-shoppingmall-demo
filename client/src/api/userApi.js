const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/users`;

const parseErrorMessage = (message) => {
  if (!message) return '요청에 실패했습니다.';

  if (message.includes('user_id already exists')) return '이미 사용 중인 아이디입니다.';
  if (message.includes('email already exists')) return '이미 사용 중인 이메일입니다.';
  if (message.includes('user_id is required')) return '아이디를 입력해주세요.';
  if (message.includes('name is required')) return '이름을 입력해주세요.';
  if (message.includes('email is required')) return '이메일을 입력해주세요.';
  if (message.includes('password is required')) return '비밀번호를 입력해주세요.';
  if (message.includes('User not found')) return '사용자를 찾을 수 없습니다.';
  if (message.includes('Invalid user id')) return '올바르지 않은 사용자 ID입니다.';

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

// GET /api/users — 전체 사용자 목록 조회
export const getUsers = async () => request(API_BASE_URL);

// GET /api/users/count — 총 회원 수 조회
export const getUserCount = async () => request(`${API_BASE_URL}/count`);

// POST /api/users — 회원가입 (userController.createUser)
export const createUser = async (userData) =>
  request(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
