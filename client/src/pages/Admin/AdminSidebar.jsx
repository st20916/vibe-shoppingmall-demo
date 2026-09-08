import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_MENU } from '../../data/adminData';

function AdminSidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <aside className={`admin-sidebar${isMenuOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="admin-sidebar__title"
        aria-expanded={isMenuOpen}
        aria-controls="admin-sidebar-menu"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <span>Admin Menu</span>
        <span className="admin-sidebar__chevron" aria-hidden="true" />
      </button>

      <div id="admin-sidebar-menu" className="admin-sidebar__body">
        {ADMIN_MENU.map((group) => (
          <div key={group.title} className="admin-sidebar__group">
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => {
                const label = typeof item === 'string' ? item : item.label;
                const to = typeof item === 'string' ? null : item.to;

                return (
                  <li key={label}>
                    {to ? <Link to={to}>{label}</Link> : <a href={`#${label}`}>{label}</a>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="admin-sidebar__help">
          <Link to="/">홈으로</Link>
          <Link to="/admin">Admin 홈</Link>
          <a href="#inquiry">1:1 문의</a>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
