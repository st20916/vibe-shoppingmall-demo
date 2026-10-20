# 프로젝트 개요

쇼핑몰 데모 프로젝트. React 기반 클라이언트(SPA)와 Express 기반 서버(REST API)로 구성되어 있으며, 회원/상품/카테고리/장바구니/주문(결제)과 관리자 백오피스를 제공한다.

## client (`client/`)

- **스택**: React 19 + Vite 8 (JavaScript), react-router-dom 7
- 별도 상태관리 라이브러리/UI 컴포넌트 라이브러리 없음 — 커스텀 훅(`useAuth`, `useCartCount`)과 페이지별 CSS로 구성
- 인증: JWT를 localStorage에 저장 (`utils/authStorage.js`)
- 이미지 업로드: Cloudinary Upload Widget / 결제: PortOne(아임포트)

**구조 (`src/`)**
- `api/` — 도메인별 fetch 래퍼 (userApi, authApi, productApi, cartApi, orderApi, categoryApi)
- `hooks/` — useAuth.js, useCartCount.js
- `components/` — CartIconLink, UserMenu, CancelReasonModal 등
- `data/` — 목업/정적 데이터
- `utils/` — authStorage.js, cloudinary.js
- `pages/` — Home, Cart, Order(Order/OrderSuccess/OrderFail/OrderList), ProductDetail, Login, SignUp, Admin(ProductManage, OrderManage, MemberManage, CategoryManage)

**주요 기능**: 홈/상품 상세/장바구니/주문(PortOne 결제)·주문내역, 로그인/회원가입, 관리자 대시보드(상품/주문/회원/카테고리 관리, `user_type === 'admin'`으로 접근 제어)

## server (`server/`)

- **스택**: Node.js + Express 5, MongoDB + Mongoose 9
- 인증: jsonwebtoken + bcryptjs
- 기타: cors, dotenv, nodemon(dev), PortOne 결제 검증 (`utils/portone.js`)

**구조 (`src/`)**
- `index.js`, `app.js` — 엔트리 / Express 앱 설정
- `config/db.js` — MongoDB 연결
- `controllers/` — userController, productController, categoryController, cartController, orderController
- `middleware/` — authMiddleware.js(JWT 인증), errorHandler.js
- `models/` — User, Product, Category, Cart, Order (Mongoose 스키마)
- `utils/` — jwt.js, portone.js
- `routes/` — index.js + userRoutes, authRoutes, productRoutes, categoryRoutes, cartRoutes, orderRoutes

**주요 기능**: 인증(로그인, `/me`), 회원 관리(CRUD + count, 역할: customer/seller/admin), 상품 CRUD(페이지네이션/검색), 카테고리 CRUD(기본 보호 카테고리 3개), 장바구니(JWT 보호, 아이템 추가/수정/삭제), 주문(장바구니 기반 체크아웃 + PortOne 결제 검증, 상태 흐름 pending→paid→preparing→shipping→delivered/cancelled, 관리자 전용 전체 주문 목록/상태별 카운트)
