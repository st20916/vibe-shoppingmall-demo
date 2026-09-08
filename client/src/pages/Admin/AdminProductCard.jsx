import { Link } from 'react-router-dom';

function AdminProductCard({ product }) {
  const priceText = `${Number(product.price).toLocaleString()}원`;

  return (
    <article className="admin-product-card">
      <Link
        to="/admin/products"
        className="admin-product-card__link"
        aria-label={`${product.name} 상품 관리로 이동`}
      >
        <div className="admin-product-card__media">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="admin-product-card__image"
              loading="lazy"
            />
          ) : (
            <div className="admin-product-card__image admin-product-card__image--empty" aria-hidden="true" />
          )}
        </div>
        <div className="admin-product-card__info">
          <p className="admin-product-card__brand">{product.category}</p>
          <p className="admin-product-card__id">{product.product_id}</p>
          <p className="admin-product-card__name">{product.name}</p>
          <p className="admin-product-card__price">
            <strong>{priceText}</strong>
          </p>
        </div>
      </Link>
    </article>
  );
}

export default AdminProductCard;
