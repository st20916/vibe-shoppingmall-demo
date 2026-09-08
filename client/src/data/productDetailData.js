export const DETAIL_TABS = [
  { id: 'info', label: '상품정보' },
  { id: 'reviews', label: '리뷰' },
  { id: 'qna', label: 'Q&A' },
  { id: 'shipping', label: '배송/교환' },
];

export const DETAIL_BADGES = ['오늘드림', '무료배송', '증정'];

export const DETAIL_RATING = {
  average: 4.8,
  count: 1284,
  distribution: [
    { stars: 5, percent: 82 },
    { stars: 4, percent: 12 },
    { stars: 3, percent: 4 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 1 },
  ],
};

export const DETAIL_REVIEWS = [
  {
    id: 'r1',
    user: 'skin****',
    rating: 5,
    date: '2026.08.28',
    tags: ['건성', '민감성'],
    text: '처음 써봤는데 자극 없이 촉촉해서 만족합니다. 구성도 알차고 선물용으로도 좋을 것 같아요.',
    helpful: 42,
  },
  {
    id: 'r2',
    user: 'glow****',
    rating: 5,
    date: '2026.08.21',
    tags: ['복합성'],
    text: '향이 은은하고 흡수력이 좋아요. 아침저녁 루틴에 넣기 딱입니다.',
    helpful: 28,
  },
  {
    id: 'r3',
    user: 'daily****',
    rating: 4,
    date: '2026.08.12',
    tags: ['지성'],
    text: '전반적으로 만족합니다. 다만 가격대가 있어서 세일할 때 구매하는 걸 추천해요.',
    helpful: 15,
  },
];

export const DETAIL_QNA = [
  {
    id: 'q1',
    question: '민감성 피부도 사용 가능한가요?',
    answer: '대부분의 피부 타입에 사용 가능하나, 개인차에 따라 패치 테스트를 권장드립니다.',
    date: '2026.08.10',
  },
  {
    id: 'q2',
    question: '오늘드림으로 받을 수 있나요?',
    answer: '지역에 따라 오늘드림 가능 여부가 다를 수 있습니다. 장바구니에서 확인해 주세요.',
    date: '2026.08.05',
  },
];

export const DETAIL_SHIPPING = [
  { label: '배송비', value: '2,500원 (3만원 이상 무료배송)' },
  { label: '배송 안내', value: '평균 1~2일 이내 출고 (주말·공휴일 제외)' },
  { label: '교환/반품', value: '상품 수령 후 7일 이내 신청 가능 (단순 변심 시 왕복 배송비 고객 부담)' },
  { label: '불가 사유', value: '사용한 상품, 포장 훼손, 시간 경과로 재판매이 어려운 경우' },
];

/** 상품 스펙 표 — 실제 상품 필드로 일부 채움 */
export const buildProductSpecs = (product) => [
  { label: '카테고리', value: product.category || '-' },
  { label: '상품명', value: product.name || '-' },
  { label: '판매가', value: `${Number(product.price).toLocaleString()}원` },
  { label: '주요 사양', value: '데일리 착용·사용에 적합한 구성' },
  { label: '제조국', value: '대한민국' },
  { label: '판매자', value: 'Shopping Demo' },
  {
    label: '상품 설명',
    value: product.description?.trim() || '상세 설명이 등록되지 않았습니다.',
  },
  { label: '주의사항', value: '제품 특성에 따라 사용감이 다를 수 있습니다. 이상 시 사용을 중단해 주세요.' },
];

export const DETAIL_PROMO = {
  title: '구매 고객 특별 혜택',
  items: [
    '본품 구매 시 미니 샘플 증정 (소진 시 대체)',
    '회원 첫 구매 추가 쿠폰 적용 가능',
    '리뷰 작성 시 다음 구매 적립 혜택',
  ],
};
