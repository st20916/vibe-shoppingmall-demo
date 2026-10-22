import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  clearSearchHistory,
  deleteSearchHistoryItem,
  getPopularKeywords,
  getSearchHistory,
  searchProducts,
} from '../../api/searchApi';
import { useAuth } from '../../hooks/useAuth';
import HomeFooter from '../Home/HomeFooter';
import HomeHeader from '../Home/HomeHeader';
import ProductCard from '../Home/ProductCard';
import './SearchResults.css';

const PAGE_LIMIT = 20;

const toCardProduct = (product) => ({
  id: product._id,
  brand: product.category,
  name: product.name,
  price: `${Number(product.price).toLocaleString()}원`,
  image: product.image,
});

function SearchResults() {
  const { user, isAdmin, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [inputValue, setInputValue] = useState(query);

  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  const [popularKeywords, setPopularKeywords] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setInputValue(query);
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setPagination(null);
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      setIsFetching(true);
      setError('');

      try {
        const result = await searchProducts({ q: query, page, limit: PAGE_LIMIT });
        if (cancelled) return;
        setResults(Array.isArray(result.data) ? result.data : []);
        setPagination(result.pagination || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '검색 중 문제가 발생했습니다.');
          setResults([]);
          setPagination(null);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [query, page]);

  useEffect(() => {
    let cancelled = false;

    getPopularKeywords()
      .then((result) => {
        if (!cancelled) setPopularKeywords(Array.isArray(result.data) ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setPopularKeywords([]);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const refreshHistory = () => {
    if (!user) {
      setHistory([]);
      return;
    }

    getSearchHistory()
      .then((result) => setHistory(Array.isArray(result.data) ? result.data : []))
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, query]);

  const products = useMemo(() => results.map(toCardProduct), [results]);

  const runSearch = (keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(inputValue);
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      await deleteSearchHistoryItem(id);
      refreshHistory();
    } catch {
      // 조용히 무시: 다음 새로고침 시 다시 동기화된다
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearSearchHistory();
      setHistory([]);
    } catch {
      // 조용히 무시
    }
  };

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="search-page">
      <HomeHeader user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="search-page__main">
        <section className="search-page__hero">
          <form className="search-page__hero-form" onSubmit={handleSubmit}>
            <span className="search-page__hero-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="검색어를 입력하세요"
              aria-label="상품 검색"
              autoFocus
            />
          </form>

          {query && (
            <p className="search-page__summary">
              <strong>&lsquo;{query}&rsquo;</strong>에 대한 검색결과
              {pagination ? ` ${pagination.total}개` : ''}
            </p>
          )}
        </section>

        {!query && (
          <section className="search-page__suggest">
            {history.length > 0 && (
              <div className="search-page__suggest-group">
                <div className="search-page__suggest-head">
                  <h2>최근 검색어</h2>
                  <button type="button" onClick={handleClearHistory}>
                    전체 삭제
                  </button>
                </div>
                <ul className="search-page__chips">
                  {history.map((item) => (
                    <li key={item._id} className="search-page__chip">
                      <button type="button" onClick={() => runSearch(item.keyword)}>
                        {item.keyword}
                      </button>
                      <button
                        type="button"
                        className="search-page__chip-remove"
                        aria-label={`${item.keyword} 삭제`}
                        onClick={() => handleDeleteHistoryItem(item._id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {popularKeywords.length > 0 && (
              <div className="search-page__suggest-group">
                <div className="search-page__suggest-head">
                  <h2>인기 검색어</h2>
                </div>
                <ul className="search-page__chips">
                  {popularKeywords.map((item, index) => (
                    <li key={item.keyword} className="search-page__chip search-page__chip--plain">
                      <button type="button" onClick={() => runSearch(item.keyword)}>
                        <em>{index + 1}</em>
                        {item.keyword}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {query && (
          <section className="search-page__results">
            {error && <p className="search-page__error">{error}</p>}

            {isFetching ? (
              <p className="search-page__status">검색 중...</p>
            ) : products.length === 0 ? (
              <div className="search-page__empty">
                <p>
                  <strong>&lsquo;{query}&rsquo;</strong>에 대한 검색결과가 없습니다.
                </p>
                <p className="search-page__empty-sub">
                  입력하신 검색어의 철자가 정확한지 확인해주세요.
                </p>
              </div>
            ) : (
              <>
                <div className="home-products">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="search-page__pagination">
                    <button
                      type="button"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      이전
                    </button>
                    <span>
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}

export default SearchResults;
