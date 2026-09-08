import { Link } from 'react-router-dom';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';

function AdminHeader({ user, onLogout }) {
  return (
    <header className="admin-header">
      <div className="admin-header__inner">
        <Link to="/" className="admin-header__logo">
          JJShopping
        </Link>
        <form
          className="admin-header__search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input type="search" name="q" placeholder="검색어를 입력하세요" aria-label="검색" />
          <button type="submit" aria-label="검색">
            ⌕
          </button>
        </form>
        <div className="admin-header__utils">
          <span aria-hidden="true">♡</span>
          <span aria-hidden="true">👤</span>
          <UserMenu user={user} onLogout={onLogout} label={user ? `${user.name}님` : ''} />
          <CartIconLink enabled={Boolean(user)} />
        </div>
      </div>
      <nav className="admin-header__nav" aria-label="카테고리">
        <a href="#dept">백화점</a>
        <a href="#mart">마트</a>
        <a href="#beauty">뷰티</a>
        <a href="#fashion">패션</a>
        <a href="#living">리빙</a>
      </nav>
    </header>
  );
}

export default AdminHeader;
