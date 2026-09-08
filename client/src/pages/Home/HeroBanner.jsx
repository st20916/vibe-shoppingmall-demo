function HeroBanner({ banners }) {
  return (
    <section className="home-hero" aria-label="메인 배너">
      <div className="home-hero__grid">
        {banners.map((banner, index) => (
          <article key={banner.id} className="home-hero__item">
            <img
              src={banner.image}
              alt={banner.alt}
              width={600}
              height={800}
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
            />
            {(banner.title || banner.subtitle) && (
              <div className="home-hero__caption">
                {banner.title && <p className="home-hero__title">{banner.title}</p>}
                {banner.subtitle && <p className="home-hero__subtitle">{banner.subtitle}</p>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default HeroBanner;
