# Shopping Demo

쇼핑몰 데모 프로젝트입니다. 프론트엔드(React)와 백엔드(Express)로 구성됩니다.

## 프로젝트 구조

```
shopping-demo/
├── client/    # React + Vite 프론트엔드
└── server/    # Node.js + Express + MongoDB API 서버
```

## 시작하기

### 서버

```bash
cd server
npm install
npm run dev
```

→ `http://localhost:5000`

### 클라이언트

```bash
cd client
npm install
npm run dev
```

→ `http://localhost:5173`

## 주요 기능

- **로그인** — 이메일/비밀번호 → `POST /api/auth/login` → JWT 토큰 발급
- **회원가입** — 클라이언트 폼 → `POST /api/users` → MongoDB 저장
- **비밀번호 암호화** — 서버에서 `bcryptjs`로 해시 후 저장
- **User CRUD API** — `/api/users` 엔드포인트
- **Product CRUD API** — `/api/products` 엔드포인트
- **Cart CRUD API** — `/api/cart` 엔드포인트
- **Order CRUD API** — `/api/orders` 엔드포인트

## 문서

- [Client README](./client/README.md)
- [Server README](./server/README.md)

## 변경 이력

| 날짜 | 영역 | 내용 |
|------|------|------|
| 2026-09-09 | client | Admin 카테고리 관리 페이지(`/admin/categories`) CRUD·삭제 모달 |
| 2026-09-09 | server | Category CRUD (`/api/categories`, 기본 3개 삭제 불가) |
| 2026-09-09 | client | Admin 회원 목록 페이지(`/admin/members`) + 사이드바 연동 |
| 2026-09-09 | client | Admin 대시보드 회원 수를 `GET /api/users/count`로 표시 |
| 2026-09-09 | server | 총 회원 수 조회 API (`GET /api/users/count`) |
| 2026-09-08 | client/server | 주문 취소 사유(`cancelReason`) 필드·API·UI 연동 |
| 2026-09-08 | client/server | Admin 주문/배송 조회 페이지 + `GET /api/orders/admin` |
| 2026-09-08 | client/server | 주문 목록 상태 탭 + `GET /api/orders?status=` 필터 |
| 2026-09-08 | client | 주문 목록 페이지(`/orders`) + 성공 페이지 버튼 연동 |
| 2026-09-07 | client | 주문 성공(`/order/success`)·실패(`/order/fail`) 페이지 추가 |
| 2026-09-07 | server | 주문 생성 시 중복 체크 + 포트원 결제 검증 |
| 2026-09-07 | client | 포트원 IMP/채널키를 `VITE_PORTONE_*` env로 분리 |
| 2026-09-07 | client | 포트원 결제: `pg` 대신 `channelKey`(inicis_v2) 사용 |
| 2026-09-07 | client | 주문 결제: `IMP.request_pay` 연동 후 주문 생성 |
| 2026-09-07 | client | 주문 페이지 포트원 `IMP.init(imp15734274)` 초기화 |
| 2026-09-07 | client | 결제 페이지(`/order`) + 장바구니 주문하기 연동 |
| 2026-09-07 | server | Order 스키마·CRUD API (`/api/orders`, shipping 제외) |
| 2026-09-06 | client | 상품 상세 장바구니 담기 (`POST /api/cart/items`) |
| 2026-09-06 | client | 헤더 장바구니 아이콘·수량 배지 + `/cart` 페이지 |
| 2026-09-06 | server | Cart CRUD API (`/api/cart`, JWT 인증, items 추가·수정·삭제) |
| 2026-09-06 | server | Cart(장바구니) 스키마 추가 — 사용자당 1개, items(product/quantity) |
| 2026-09-06 | client | 상품 상세 페이지 (`/products/:id`) + Home 카드 클릭 연동 |
| 2026-09-06 | server/client | 상품 삭제 확인 모달 + `confirm`/`product_id` 서버 검증 |
| 2026-09-06 | server/client | 메인용 `GET /api/products/public` (상품코드·설명 제외) + Home 연동 |
| 2026-09-06 | server | 상품 목록 API 페이지네이션 (`page`/`limit`, 기본 10개) |
| 2026-09-06 | client | Admin 대시보드: 주문/추천/리뷰 제거, 최근 등록 상품 10개 표시 |
| 2026-09-06 | client | 상품 관리: 목록 클릭 시 수정 폼 + `PUT /api/products/:id` 연동 |
| 2026-09-06 | server | Product CRUD API (`/api/products`) |
| 2026-09-06 | server | Product 스키마 추가 (`product_id` unique, 카테고리 enum) |
| 2026-09-06 | client | 상품 이미지 업로드를 Cloudinary Upload Widget으로 전환 |
| 2026-09-06 | client | 상품 관리 페이지 (`/admin/products`) — 목록/등록 탭·검색·필터 |
| 2026-09-06 | client | 정적 데이터를 `src/data/` 폴더로 분리 |
| 2026-09-06 | client | Admin 대시보드 페이지 (`/admin`), 상품 이미지 placeholder |
| 2026-09-03 | client | Home 컴포넌트 분리·useAuth 훅·이미지/탭 최적화 |
| 2026-09-03 | client | 메인 페이지 SSG 스타일 리디자인, 로그인/Admin navbar 분기 |
| 2026-09-02 | server | JWT 토큰으로 사용자 정보 조회 API (`GET /api/auth/me`) |
| 2026-09-02 | server | 로그인 성공 시 JWT 토큰 발급 (`jsonwebtoken`) |
| 2026-09-02 | client | 로그인 JWT 토큰 `localStorage` 저장 |
| 2026-09-02 | server | 이메일/비밀번호 로그인 API (`POST /api/auth/login`) |
| 2026-09-02 | client | 로그인 페이지, Alert 성공/실패 처리 |
| 2026-09-01 | server | User 생성/수정 시 비밀번호 `bcryptjs` 암호화 저장 |
| 2026-09-01 | client | 회원가입 폼 → `POST /api/users` 연동 (`userApi.js`) |
| 2026-08-31 | client | Vite + React 회원가입 페이지, React Router 설정 |
| 2026-08-31 | server | User 스키마, CRUD API 구현 |
