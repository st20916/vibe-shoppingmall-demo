import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './UserMenu.css';

function UserMenu({ user, onLogout, label }) {
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  if (!user) return null;

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    onLogout?.();
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        {label || `${user.name}님 환영합니다!`}
      </button>
      {isMenuOpen && (
        <ul className="user-menu__dropdown" role="menu">
          <li role="none">
            <Link to="/orders" role="menuitem" onClick={closeMenu}>
              내 주문 목록
            </Link>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={handleLogout}>
              로그아웃
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserMenu;
