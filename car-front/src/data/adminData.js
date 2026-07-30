export const adminSummaryCards = [

];

export const adminCars = [
  {
    id: 1,
    name: "현대 아반떼 CN7",
    carName: "현대 아반떼 CN7",
    dealer: "김딜러",
    company: "서울오토",
    price: "1,650만원",
    status: "판매중",
    date: "2026-07-03",
  },
  {
    id: 2,
    name: "기아 K5",
    carName: "기아 K5",
    dealer: "이딜러",
    company: "강남모터스",
    price: "2,100만원",
    status: "검토중",
    date: "2026-07-03",
  },
  {
    id: 3,
    name: "제네시스 G80",
    carName: "제네시스 G80",
    dealer: "박딜러",
    company: "프리미엄카",
    price: "4,800만원",
    status: "판매완료",
    date: "2026-07-02",
  },
  {
    id: 4,
    name: "쉐보레 트레일블레이저",
    carName: "쉐보레 트레일블레이저",
    company: "오토플러스",
    dealer: "최딜러",
    price: "1,920만원",
    status: "승인대기",
    date: "2026-07-02",
  },
];

export const adminReports = [
  {
    id: 1,
    carId: 1,
    target: "현대 아반떼 CN7",
    reason: "허위 매물 의심",
    reporter: "홍길동",
    status: "처리대기",
    date: "2026-07-03",
  },
  {
    id: 2,
    carId: 2,
    target: "기아 K5",
    reason: "가격 정보 불일치",
    reporter: "김회원",
    status: "검토중",
    date: "2026-07-02",
  },
  {
    id: 3,
    carId: 3,
    target: "제네시스 G80",
    reason: "이미 판매된 차량",
    reporter: "이회원",
    status: "처리완료",
    date: "2026-07-01",
  },
];

export const adminCompanyChurnUsers = [
  {
    id: 1,
    type: "회사",
    memberType: "회사",
    name: "서울오토",
    recentActivity: "18일 전",
    churnRate: "88%",
    risk: "높음",
    action: "상담 필요",
    status: "처리전",
    reason: "최근 매물 등록 감소, 딜러 접속률 감소",
  },
  {
    id: 2,
    type: "회사",
    memberType: "회사",
    name: "강남모터스",
    recentActivity: "12일 전",
    churnRate: "72%",
    risk: "높음",
    action: "수수료 혜택 안내",
    status: "상담완료",
    reason: "판매 완료 수 감소, 문의 응답률 감소",
  },
  {
    id: 3,
    type: "회사",
    memberType: "회사",
    name: "오토플러스",
    recentActivity: "6일 전",
    churnRate: "46%",
    risk: "보통",
    action: "모니터링",
    status: "모니터링중",
    reason: "최근 활동은 있으나 등록 매물 증가 없음",
  },
];

export const adminDealerChurnUsers = [
  {
    id: 1,
    type: "개인딜러",
    memberType: "개인딜러",
    name: "김딜러",
    recentActivity: "14일 전",
    churnRate: "82%",
    risk: "높음",
    action: "상담 필요",
    status: "처리전",
    reason: "최근 로그인 없음, 등록 매물 조회수 감소",
  },
  {
    id: 2,
    type: "개인딜러",
    memberType: "개인딜러",
    name: "이딜러",
    recentActivity: "9일 전",
    churnRate: "67%",
    risk: "높음",
    action: "광고 쿠폰 지급",
    status: "쿠폰지급완료",
    reason: "판매 전환율 감소, 매물 수정 활동 없음",
  },
  {
    id: 3,
    type: "개인딜러",
    memberType: "개인딜러",
    name: "박딜러",
    recentActivity: "4일 전",
    churnRate: "41%",
    risk: "보통",
    action: "모니터링",
    status: "모니터링중",
    reason: "활동은 있으나 신규 매물 등록이 적음",
  },
];

export const adminChurnUsers = [
  ...adminCompanyChurnUsers,
  ...adminDealerChurnUsers,
];

export const adminPendingTasks = [

];
