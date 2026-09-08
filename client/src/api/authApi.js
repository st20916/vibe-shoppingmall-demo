const LOGIN_API_URL = '/api/auth/login';
const ME_API_URL = '/api/auth/me';

const parseLoginErrorMessage = (message) => {
  if (!message) return '로그인에 실패했습니다.';
  if (message.includes('email and password are required')) return '이메일과 비밀번호를 입력해주세요.';
  if (message.includes('Invalid email or password')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  return message;
};

// POST /api/auth/login — 로그인 (userController.loginUser)
export const loginUser = async ({ email, password }) => {
  const response = await fetch(LOGIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(parseLoginErrorMessage(result.message));
  }

  return result;
};

// GET /api/auth/me — 토큰으로 현재 사용자 정보 조회
export const getCurrentUser = async (token) => {
  const response = await fetch(ME_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  if (!response.ok) {
    throw new Error(result.message || '사용자 정보를 가져올 수 없습니다.');
  }

  return result;
};
