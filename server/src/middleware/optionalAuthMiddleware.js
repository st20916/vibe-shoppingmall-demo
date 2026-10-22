const { verifyToken } = require('../utils/jwt');

// Authorization 헤더가 있고 유효한 토큰이면 req.user를 채우고,
// 없거나 유효하지 않으면 req.user를 null로 두고 그대로 통과시킨다 (비로그인 접근 허용)
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = optionalAuthMiddleware;
