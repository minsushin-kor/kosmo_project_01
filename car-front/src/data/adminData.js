export const adminSummaryCards = [
  {
    title: "전체 회원",
    value: "1,248",
    unit: "명",
    change: "+32명",
    description: "일반회원, 기업회원, 딜러 포함",
  },
  {
    title: "등록 매물",
    value: "356",
    unit: "대",
    change: "+18대",
    description: "현재 사이트에 등록된 차량",
  },
  {
    title: "이번 달 거래",
    value: "89",
    unit: "건",
    change: "+11건",
    description: "판매 완료 기준 거래 수",
  },
  {
    title: "검토 대기",
    value: "12",
    unit: "건",
    change: "-3건",
    description: "승인, 신고, 문의 처리 대기",
  },
];

export const adminMembers = [
  {
    id: 1,
    type: "일반회원",
    name: "홍길동",
    email: "hong@test.com",
    status: "정상",
    joinDate: "2026-07-01",
  },
  {
    id: 2,
    type: "기업회원",
    name: "서울오토",
    email: "seoul@auto.com",
    status: "승인대기",
    joinDate: "2026-07-02",
  },
  {
    id: 3,
    type: "딜러회원",
    name: "김딜러",
    email: "dealer@test.com",
    status: "정상",
    joinDate: "2026-07-03",
  },
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
    target: "현대 아반떼 CN7",
    reason: "허위 매물 의심",
    reporter: "홍길동",
    status: "처리대기",
    date: "2026-07-03",
  },
  {
    id: 2,
    target: "기아 K5",
    reason: "가격 정보 불일치",
    reporter: "김회원",
    status: "검토중",
    date: "2026-07-02",
  },
  {
    id: 3,
    target: "제네시스 G80",
    reason: "이미 판매된 차량",
    reporter: "이회원",
    status: "처리완료",
    date: "2026-07-01",
  },
];

export const adminChurnUsers = [
  {
    id: 1,
    type: "딜러회원",
    memberType: "딜러회원",
    name: "김딜러",
    recentActivity: "14일 전",
    churnRate: "82%",
    risk: "높음",
    action: "상담 필요",
  },
  {
    id: 2,
    type: "일반회원",
    memberType: "일반회원",
    name: "홍길동",
    recentActivity: "21일 전",
    churnRate: "76%",
    risk: "높음",
    action: "쿠폰 지급",
  },
  {
    id: 3,
    type: "딜러회원",
    memberType: "딜러회원",
    name: "이딜러",
    recentActivity: "5일 전",
    churnRate: "43%",
    risk: "보통",
    action: "모니터링",
  },
];

export const adminPendingTasks = [
  {
    id: 1,
    title: "기업회원 승인 요청",
    count: 4,
  },
  {
    id: 2,
    title: "신고된 매물 검토",
    count: 3,
  },
  {
    id: 3,
    title: "딜러 계정 발급 대기",
    count: 5,
  },
  {
    id: 4,
    title: "고객 문의 답변 대기",
    count: 8,
  },
];