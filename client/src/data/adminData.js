export const ADMIN_MENU = [
  {
    title: '주문 관리',
    items: [
      { label: '주문/배송 조회', to: '/admin/orders' },
    ],
  },
  {
    title: '상품 관리',
    items: [
      { label: '상품 목록', to: '/admin/products' },
      '재고 관리',
      '카테고리 관리',
    ],
  },
  {
    title: '회원 관리',
    items: ['회원 목록', '등급/권한 관리', '리뷰 관리'],
  },
  {
    title: '혜택 관리',
    items: ['쿠폰', '포인트', '프로모션'],
  },
  {
    title: '서비스/문의',
    items: ['1:1 문의', '공지사항', '설정'],
  },
];

export const ADMIN_STATS = [
  { label: '쿠폰', value: '12' },
  { label: '판매 금액', value: '2,450,000' },
  { label: '대기 주문', value: '8' },
  { label: '회원 수', value: '1,024' },
];
