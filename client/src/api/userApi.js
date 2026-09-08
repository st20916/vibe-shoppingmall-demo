const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api/users`;

const parseErrorMessage = (message) => {
  if (!message) return '회원가입에 실패했습니다.';

  if (message.includes('user_id already exists')) return '이미 사용 중인 아이디입니다.';
  if (message.includes('email already exists')) return '이미 사용 중인 이메일입니다.';
  if (message.includes('user_id is required')) return '아이디를 입력해주세요.';
  if (message.includes('name is required')) return '이름을 입력해주세요.';
  if (message.includes('email is required')) return '이메일을 입력해주세요.';
  if (message.includes('password is required')) return '비밀번호를 입력해주세요.';

  return message;
};

// POST /api/users — 회원가입 (userController.createUser)
export const createUser = async (userData) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
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
