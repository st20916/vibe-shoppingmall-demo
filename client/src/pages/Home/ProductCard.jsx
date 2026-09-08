import { Link } from 'react-router-dom';

function ProductCard({ product, eager = false }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__link">
        <div className="product-card__image-wrap">
          {product.isNew && <span className="product-card__badge">NEW</span>}
          <img
            src={product.image}
            alt={product.name}
            className="product-card__image"
            width={400}
            height={400}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
          <button
            type="button"
            className="product-card__wish"
            aria-label="위시리스트"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            ♡
          </button>
          {product.discount && <span className="product-card__discount">{product.discount}</span>}
        </div>
        <div className="product-card__info">
          <p className="product-card__brand">{product.brand}</p>
          <p className="product-card__name">{product.name}</p>
          <p className="product-card__price">{product.price}</p>
          {product.colors && (
            <div className="product-card__colors">
              {product.colors.map((color) => (
                <span
                  key={color}
                  className="product-card__swatch"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
