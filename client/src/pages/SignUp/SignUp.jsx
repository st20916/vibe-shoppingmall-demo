import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/userApi';
import HomeFooter from '../Home/HomeFooter';
import './SignUp.css';

function FormRow({ label, required, children }) {
  return (
    <div className="form-row">
      <div className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </div>
      <div className="form-field">{children}</div>
    </div>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    user_id: '',
    password: '',
    name: '',
    postalCode: '',
    basicAddress: '',
    detailAddress: '',
    email: '',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const buildAddress = () => {
    const parts = [form.postalCode, form.basicAddress, form.detailAddress].filter(Boolean);
    return parts.join(' ').trim();
  };

  const validateForm = () => {
    if (!form.user_id.trim()) return '아이디를 입력해주세요.';
    if (!form.password) return '비밀번호를 입력해주세요.';
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!form.email.trim()) return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '올바른 이메일 형식을 입력해주세요.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const address = buildAddress();

      await createUser({
        user_id: form.user_id.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        user_type: 'customer',
        ...(address && { address }),
      });

      setSuccess('회원가입이 완료되었습니다.');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-layout">
      <div className="signup-page">
        <h1>회원가입</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="section-header">
            <span>기본정보</span>
            <span className="required-note">
              <span>*</span> 필수
            </span>
          </div>

          <FormRow label="아이디" required>
            <input
              type="text"
              className="medium"
              value={form.user_id}
              onChange={handleChange('user_id')}
            />
          </FormRow>

          <FormRow label="비밀번호" required>
            <input
              type="password"
              className="medium"
              value={form.password}
              onChange={handleChange('password')}
            />
          </FormRow>

          <FormRow label="이름" required>
            <input
              type="text"
              className="medium"
              value={form.name}
              onChange={handleChange('name')}
            />
          </FormRow>

          <FormRow label="주소">
            <div className="address-fields">
              <div>
                <input
                  type="text"
                  className="postal"
                  placeholder="우편번호"
                  value={form.postalCode}
                  onChange={handleChange('postalCode')}
                />
                <button type="button" className="address-search-btn">
                  주소검색
                </button>
              </div>
              <input
                type="text"
                className="full"
                placeholder="기본주소"
                value={form.basicAddress}
                onChange={handleChange('basicAddress')}
              />
              <input
                type="text"
                className="full"
                placeholder="나머지 주소(선택 입력 가능)"
                value={form.detailAddress}
                onChange={handleChange('detailAddress')}
              />
            </div>
          </FormRow>

          <FormRow label="이메일" required>
            <input
              type="email"
              className="medium"
              value={form.email}
              onChange={handleChange('email')}
            />
          </FormRow>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="submit-area">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '가입하기'}
          </button>
        </div>
      </form>
      </div>

      <HomeFooter />
    </div>
  );
}

export default SignUp;
