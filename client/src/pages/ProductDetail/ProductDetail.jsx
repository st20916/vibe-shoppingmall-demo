import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem } from '../../api/cartApi';
import { getProductById, getPublicProducts } from '../../api/productApi';
import CartIconLink from '../../components/CartIconLink';
import {
  DETAIL_BADGES,
  DETAIL_PROMO,
  // DETAIL_QNA,
  // DETAIL_RATING,
  // DETAIL_REVIEWS,
  DETAIL_SHIPPING,
  DETAIL_TABS,
  buildProductSpecs,
} from '../../data/productDetailData';
import { useAuth } from '../../hooks/useAuth';
import { getToken } from '../../utils/authStorage';
import HomeFooter from '../Home/HomeFooter';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('info');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      setQuantity(1);
      setActiveImage(0);
      setActiveTab('info');

      try {
        const [detailResult, listResult] = await Promise.all([
          getProductById(id),
          getPublicProducts(),
        ]);

        if (cancelled) return;

        const detail = detailResult.data;
        setProduct(detail);

        const sameCategory = (listResult.data || [])
          .filter((item) => String(item._id) !== String(detail._id))
          .filter((item) => item.category === detail.category)
          .slice(0, 8);

        setRelated(sameCategory);
      } catch (err) {
        if (!cancelled) {
          setProduct(null);
          setRelated([]);
          setError(err.message || '상품을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    window.scrollTo(0, 0);

    return () => {
      cancelled = true;
    };
  }, [id]);

  const gallery = useMemo(() => {
    if (!product?.image) return [];
    return [
      { id: 'main', src: product.image, label: '대표' },
      { id: 'detail', src: product.image, label: '상세' },
      { id: 'side', src: product.image, label: '구성' },
    ];
  }, [product]);

  const specs = useMemo(() => (product ? buildProductSpecs(product) : []), [product]);

  // 리뷰·Q&A 탭 임시 비활성화
  const visibleTabs = useMemo(
    () => DETAIL_TABS.filter((tab) => tab.id !== 'reviews' && tab.id !== 'qna'),
    []
  );

  // const reviewTabLabel = useMemo(() => {
  //   const tab = DETAIL_TABS.find((item) => item.id === 'reviews');
  //   return `${tab.label} ${DETAIL_RATING.count}`;
  // }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const el = document.getElementById(`detail-${tabId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const changeQuantity = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(99, prev + delta)));
  };

  const handleCart = async () => {
    if (isAddingToCart || !product?._id) return;

    if (!getToken() || !user) {
      alert('장바구니에 담으려면 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    setIsAddingToCart(true);

    try {
      await addCartItem({
        product: product._id,
        quantity,
      });

      const goToCart = window.confirm(
        `장바구니에 ${quantity}개를 담았습니다.\n장바구니로 이동할까요?`
      );

      if (goToCart) {
        navigate('/cart');
      }
    } catch (err) {
      alert(err.message || '장바구니 담기에 실패했습니다.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuy = () => {
    alert(`바로구매 (${quantity}개) 기능은 준비 중입니다.`);
  };

  if (isLoading) {
    return (
      <div className="pd-page pd-page--status">
        <p>상품 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-page pd-page--status">
        <p>{error || '상품을 찾을 수 없습니다.'}</p>
        <button type="button" className="pd-btn pd-btn--ghost" onClick={() => navigate('/')}>
          홈으로
        </button>
      </div>
    );
  }

  const priceText = `${Number(product.price).toLocaleString()}원`;

  return (
    <div className="pd-page">
      <header className="pd-topbar">
        <div className="pd-topbar__inner">
          <button
            type="button"
            className="pd-topbar__icon"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <Link to="/" className="pd-topbar__logo">
            JJShopping
          </Link>
          <div className="pd-topbar__actions">
            <button type="button" className="pd-topbar__icon" aria-label="검색">
              ⌕
            </button>
            <Link to="/" className="pd-topbar__icon" aria-label="홈">
              ⌂
            </Link>
            <CartIconLink enabled={Boolean(user) && !isAuthLoading} />
          </div>
        </div>
      </header>

      <nav className="pd-breadcrumb" aria-label="상품 경로">
        <Link to="/">홈</Link>
        <span>/</span>
        <span>{product.category}</span>
      </nav>

      <section className="pd-hero">
        <div className="pd-gallery">
          <div className="pd-gallery__main">
            <img
              src={gallery[activeImage]?.src || product.image}
              alt={product.name}
              width={800}
              height={800}
            />
          </div>
          <div className="pd-gallery__thumbs" role="list">
            {gallery.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="listitem"
                className={`pd-gallery__thumb${activeImage === index ? ' is-active' : ''}`}
                onClick={() => setActiveImage(index)}
                aria-label={`${item.label} 이미지`}
              >
                <img src={item.src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="pd-summary">
          <p className="pd-summary__brand">{product.category}</p>
          <h1 className="pd-summary__name">{product.name}</h1>

          {/* 리뷰 요약 임시 비활성화
          <div className="pd-summary__rating">
            <span className="pd-summary__stars" aria-hidden="true">
              ★ {DETAIL_RATING.average}
            </span>
            <button
              type="button"
              className="pd-summary__review-link"
              onClick={() => handleTabClick('reviews')}
            >
              ({DETAIL_RATING.count.toLocaleString()}건)
            </button>
          </div>
          */}

          <div className="pd-summary__price">
            <strong>{priceText}</strong>
          </div>

          <div className="pd-summary__badges">
            {DETAIL_BADGES.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>

          <dl className="pd-summary__meta">
            <div>
              <dt>배송</dt>
              <dd>평균 1~2일 이내 출고 · 3만원 이상 무료배송</dd>
            </div>
            <div>
              <dt>카테고리</dt>
              <dd>{product.category}</dd>
            </div>
          </dl>

          <div className="pd-summary__qty">
            <span>수량</span>
            <div className="pd-qty">
              <button type="button" onClick={() => changeQuantity(-1)} aria-label="수량 감소">
                −
              </button>
              <em>{quantity}</em>
              <button type="button" onClick={() => changeQuantity(1)} aria-label="수량 증가">
                +
              </button>
            </div>
          </div>

          <div className="pd-summary__total">
            <span>총 상품금액</span>
            <strong>{`${(Number(product.price) * quantity).toLocaleString()}원`}</strong>
          </div>

          <div className="pd-summary__actions">
            <button
              type="button"
              className="pd-btn pd-btn--ghost"
              onClick={handleCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? '담는 중...' : '장바구니'}
            </button>
            <button type="button" className="pd-btn pd-btn--primary" onClick={handleBuy}>
              바로구매
            </button>
          </div>
        </div>
      </section>

      <div className="pd-tabs" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`pd-tabs__item${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="pd-section" id="detail-info">
        <h2 className="pd-section__title">상품정보</h2>

        <div className="pd-promo">
          <h3>{DETAIL_PROMO.title}</h3>
          <ul>
            {DETAIL_PROMO.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="pd-desc">
          <img src={product.image} alt="" className="pd-desc__image" />
          <div className="pd-desc__text">
            {product.description?.trim() ? (
              product.description.split('\n').map((line, index) => (
                <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
              ))
            ) : (
              <p>
                {product.name} 상품의 상세 안내입니다. 실제 상품 이미지는 위 구성을 참고해 주세요.
              </p>
            )}
          </div>
        </div>

        <table className="pd-specs">
          <caption>상품 주요 정보</caption>
          <tbody>
            {specs.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 리뷰 섹션 임시 비활성화
      <section className="pd-section" id="detail-reviews">
        <h2 className="pd-section__title">리뷰</h2>

        <div className="pd-review-summary">
          <div className="pd-review-summary__score">
            <strong>{DETAIL_RATING.average}</strong>
            <span>★ ★ ★ ★ ★</span>
            <p>{DETAIL_RATING.count.toLocaleString()}개 리뷰</p>
          </div>
          <div className="pd-review-summary__bars">
            {DETAIL_RATING.distribution.map((item) => (
              <div key={item.stars} className="pd-review-bar">
                <span>{item.stars}점</span>
                <div className="pd-review-bar__track">
                  <i style={{ width: `${item.percent}%` }} />
                </div>
                <em>{item.percent}%</em>
              </div>
            ))}
          </div>
        </div>

        <div className="pd-photo-reviews" aria-label="포토 리뷰">
          {gallery.map((item) => (
            <img key={`photo-${item.id}`} src={item.src} alt="" />
          ))}
        </div>

        <ul className="pd-review-list">
          {DETAIL_REVIEWS.map((review) => (
            <li key={review.id} className="pd-review-card">
              <div className="pd-review-card__head">
                <strong>{review.user}</strong>
                <span>★ {review.rating}.0</span>
                <time>{review.date}</time>
              </div>
              <div className="pd-review-card__tags">
                {review.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <p>{review.text}</p>
              <button type="button" className="pd-review-card__helpful">
                도움이 돼요 {review.helpful}
              </button>
            </li>
          ))}
        </ul>
      </section>
      */}

      {/* Q&A 섹션 임시 비활성화
      <section className="pd-section" id="detail-qna">
        <h2 className="pd-section__title">Q&A</h2>
        <ul className="pd-qna-list">
          {DETAIL_QNA.map((item) => (
            <li key={item.id}>
              <p className="pd-qna__q">
                <em>Q</em> {item.question}
              </p>
              <p className="pd-qna__a">
                <em>A</em> {item.answer}
              </p>
              <time>{item.date}</time>
            </li>
          ))}
        </ul>
      </section>
      */}

      <section className="pd-section" id="detail-shipping">
        <h2 className="pd-section__title">배송/교환</h2>
        <table className="pd-specs">
          <tbody>
            {DETAIL_SHIPPING.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {related.length > 0 && (
        <section className="pd-section pd-related">
          <h2 className="pd-section__title">함께 보면 좋은 상품</h2>
          <div className="pd-related__grid">
            {related.map((item) => (
              <Link key={item._id} to={`/products/${item._id}`} className="pd-related__card">
                <img src={item.image} alt={item.name} loading="lazy" />
                <p className="pd-related__category">{item.category}</p>
                <p className="pd-related__name">{item.name}</p>
                <p className="pd-related__price">{Number(item.price).toLocaleString()}원</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <HomeFooter />

      <div className="pd-sticky-buy" aria-label="구매 바로가기">
        <button
          type="button"
          className="pd-btn pd-btn--ghost"
          onClick={handleCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? '담는 중...' : '장바구니'}
        </button>
        <button type="button" className="pd-btn pd-btn--primary" onClick={handleBuy}>
          바로구매
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;
