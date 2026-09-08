import { Link } from 'react-router-dom';
import { useCartCount } from '../hooks/useCartCount';
import './CartIconLink.css';

function CartIconLink({ enabled = true }) {
  const { count } = useCartCount(enabled);
  const badgeText = count > 99 ? '99+' : String(count);

  return (
    <Link
      to="/cart"
      className="cart-icon-link"
      aria-label={count > 0 ? `장바구니 ${count}개` : '장바구니'}
    >
      <svg
        className="cart-icon-link__svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
        <path d="M3 4h2l2.2 11h10.3l1.8-7H7.2" />
      </svg>
      {count > 0 && <span className="cart-icon-link__badge">{badgeText}</span>}
    </Link>
  );
}

export default CartIconLink;
