import './HomeFooter.css';

function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer__links">
        <a href="#about">회사소개</a>
        <a href="#terms">이용약관</a>
        <a href="#privacy">개인정보처리방침</a>
        <a href="#help">고객센터</a>
      </div>
      <div className="home-footer__info">
        <div>
          <p className="home-footer__phone">1577-3419</p>
          <p className="home-footer__hours">평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
        </div>
        <div className="home-footer__social" aria-label="소셜 미디어">
          <span>Facebook</span>
          <span>Instagram</span>
        </div>
      </div>
      <p className="home-footer__legal">
        JJShopping · 대표이사 이정재 · 사업자등록번호 000-00-00000
        <br />
        주소 대전광역시 · 통신판매업신고 제0000-서울-0000호
      </p>
    </footer>
  );
}

export default HomeFooter;
