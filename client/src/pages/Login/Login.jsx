import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/authApi';
import HomeFooter from '../Home/HomeFooter';
import { useAuth } from '../../hooks/useAuth';
import { setToken } from '../../utils/authStorage';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    if (!form.password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      setToken(result.token);
      await refreshUser();

      alert(`${result.data.name}님, 로그인에 성공했습니다.`);
      navigate('/');
    } catch (err) {
      alert(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-page">
        <Link to="/" className="login-brand">
          JJShoping
        </Link>

        <div className="login-card">
          <h1>로그인</h1>
          <p className="login-card__desc">계정에 로그인하고 쇼핑을 이어가세요.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>
                이메일<span className="required">*</span>
              </span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
              />
            </label>

            <label className="login-field">
              <span>
                비밀번호<span className="required">*</span>
              </span>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-links">
            <Link to="/signup">회원가입</Link>
            <Link to="/">홈으로</Link>
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}

export default Login;
