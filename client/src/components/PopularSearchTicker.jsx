import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPopularKeywords } from '../api/searchApi';
import './PopularSearchTicker.css';

const ROTATE_INTERVAL_MS = 3500;

function PopularSearchTicker() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getPopularKeywords()
      .then((result) => {
        if (cancelled) return;
        setKeywords(Array.isArray(result.data) ? result.data : []);
        setActiveIndex(0);
      })
      .catch(() => {
        if (!cancelled) setKeywords([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (keywords.length <= 1) return undefined;

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % keywords.length);
    }, ROTATE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, [keywords]);

  if (keywords.length === 0) return null;

  const handleSelect = (keyword) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="popular-ticker">
      <span className="popular-ticker__label">인기 검색어</span>
      <div className="popular-ticker__viewport">
        {keywords.map((item, index) => (
          <button
            key={item.keyword}
            type="button"
            className={`popular-ticker__item${index === activeIndex ? ' is-active' : ''}`}
            tabIndex={index === activeIndex ? 0 : -1}
            aria-hidden={index !== activeIndex}
            onClick={() => handleSelect(item.keyword)}
          >
            <em>{index + 1}</em>
            {item.keyword}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PopularSearchTicker;
