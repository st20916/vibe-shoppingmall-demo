import { Link } from 'react-router-dom';
import CartIconLink from '../../components/CartIconLink';
import UserMenu from '../../components/UserMenu';
import { NAV_ITEMS } from '../../data/homeData';

function HomeHeader({ user, isAdmin, onLogout }) {
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    if (query) {
      alert(`"${query}" 검색 기능은 준비 중입니다.`);
    }
  };

  return (
    <header className="home-header">
      <div className="home-utility">
        <div className="home-utility__inner">
          <div className="home-utility__icons" aria-hidden="true">
            <span>⌕</span>
            <span>♡</span>
            <span>👤</span>
          </div>
          <div className="home-utility__actions">
            {user ? (
              <>
                <UserMenu user={user} onLogout={onLogout} />
                {isAdmin && (
                  <Link to="/admin" className="home-utility__btn home-utility__btn--admin">
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="home-utility__btn">
                  Login
                </Link>
                <Link to="/signup" className="home-utility__btn">
                  Join
                </Link>
              </>
            )}
            <CartIconLink enabled={Boolean(user)} />
          </div>
        </div>
      </div>

      <div className="home-brand-bar">
        <Link to="/" className="home-logo">
          JJShopping
        </Link>
        <form className="home-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            name="q"
            placeholder="검색어를 입력하세요"
            aria-label="상품 검색"
          />
          <button type="submit" className="home-search__submit">
            SEARCH
          </button>
        </form>
      </div>

      <nav className="home-nav" aria-label="주요 메뉴">
        <div className="home-nav__inner">
          <button type="button" className="home-nav__category">
            <span className="home-nav__hamburger" aria-hidden="true" />
            Category
          </button>
          <ul className="home-nav__list">
            {NAV_ITEMS.map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`}>{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default HomeHeader;
