import ProductCard from './ProductCard';

function ProductSection({
  id,
  title,
  moreHref,
  products,
  tabs,
  activeTab,
  onTabChange,
  emptyMessage = '상품이 없습니다.',
}) {
  return (
    <section className="home-section" id={id}>
      <div className="home-section__header">
        <h2 className="home-section__title">{title}</h2>
        <a href={moreHref} className="home-section__more">
          View All
        </a>
      </div>

      {tabs && (
        <div className="home-section__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`home-section__tab${activeTab === tab ? ' is-active' : ''}`}
              onClick={() => onTabChange?.(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="home-products-empty">{emptyMessage}</p>
      ) : (
        <div className="home-products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductSection;
