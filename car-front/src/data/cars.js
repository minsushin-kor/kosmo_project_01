const dealerCarTemplates = [
  ["현대", "아반떼", "현대 아반떼 CN7", "가솔린", 1600],
  ["기아", "K5", "기아 K5 3세대", "가솔린", 2050],
  ["제네시스", "G80", "제네시스 G80", "가솔린", 3450],
  ["현대", "쏘나타", "현대 쏘나타 DN8", "LPG", 2180],
  ["기아", "쏘렌토", "기아 쏘렌토 MQ4", "디젤", 3380],
  ["BMW", "520i", "BMW 520i M Sport", "가솔린", 4150],
  ["벤츠", "E300", "벤츠 E300 Avantgarde", "가솔린", 3980],
  ["쉐보레", "트레일블레이저", "쉐보레 트레일블레이저", "가솔린", 2250],
  ["르노", "QM6", "르노 QM6", "LPG", 1890],
  ["KG모빌리티", "토레스", "KG모빌리티 토레스", "가솔린", 2860],
];

const memberCarTemplates = [
  ["현대", "그랜저", "현대 그랜저 IG", "가솔린", 2200],
  ["기아", "스포티지", "기아 스포티지 NQ5", "디젤", 2680],
  ["르노", "XM3", "르노 XM3", "가솔린", 1650],
  ["현대", "투싼", "현대 투싼 NX4", "하이브리드", 2850],
  ["기아", "카니발", "기아 카니발 KA4", "디젤", 3400],
  ["제네시스", "GV70", "제네시스 GV70", "가솔린", 4550],
  ["쉐보레", "말리부", "쉐보레 더 뉴 말리부", "가솔린", 1480],
  ["KG모빌리티", "코란도", "KG모빌리티 코란도", "디젤", 1720],
  ["BMW", "320i", "BMW 320i", "가솔린", 3150],
  ["벤츠", "C200", "벤츠 C200", "가솔린", 2980],
];

const regions = [
  "서울특별시",
  "경기도",
  "인천광역시",
  "충청남도",
  "충청북도",
  "전라북도",
  "경상남도",
  "강원도",
];

const colors = [
  "화이트",
  "블랙",
  "그레이",
  "실버",
  "블루",
  "레드",
];

const dealerNames = [
  "김딜러",
  "이딜러",
  "박딜러",
  "최딜러",
  "윤딜러",
  "한딜러",
];

const companyNames = [
  "Kosmo 인증모터스",
  "천안 오토플러스",
  "서울 프리미엄카",
  "창원 굿카",
  "수원 수입차센터",
  "청주 프리미엄모터스",
];

const memberNames = [
  "정회원",
  "강회원",
  "김회원",
  "이회원",
  "박회원",
  "최회원",
];

function padNumber(value, length = 2) {
  return String(value).padStart(length, "0");
}

function makeRegisteredDate(index) {
  const day = 30 - index;

  return `2026-07-${padNumber(day)}`;
}

function makeCarNumber(index, prefix) {
  const koreanLetters = [
    "가",
    "나",
    "다",
    "라",
    "마",
    "바",
    "사",
    "아",
  ];

  return `${padNumber((index % 89) + 10)}${
    koreanLetters[index % koreanLetters.length]
  } ${prefix}${padNumber(index + 1, 3)}`;
}

const dealerCars = Array.from(
  { length: 30 },
  (_, index) => {
    const template =
      dealerCarTemplates[index % dealerCarTemplates.length];

    const [
      brand,
      modelName,
      baseCarName,
      fuel,
      basePrice,
    ] = template;

    const dealerIndex = index % dealerNames.length;

    const sequence =
      Math.floor(index / dealerCarTemplates.length) + 1;

    return {
      id: index + 1,

      brand,
      modelName,
      carName: `${baseCarName} ${sequence}호 매물`,

      year: 2018 + (index % 8),
      mileage: 18000 + index * 2700,
      price:
        basePrice +
        sequence * 70 +
        (index % 5) * 35,

      region: regions[index % regions.length],

      sellerType: "회사딜러",
      fuel,
      transmission: "자동",

      status:
        index === 28 || index === 29
          ? "판매완료"
          : "판매중",

      saleType: "NORMAL",

      imageText: modelName.toUpperCase(),
      color: colors[index % colors.length],

      displacement:
        fuel === "전기"
          ? "전기모터"
          : `${1598 + (index % 4) * 400}cc`,

      accident:
        index % 6 === 0
          ? "단순교환"
          : "무사고",

      carNumber: makeCarNumber(index, 1),

      dealerId: dealerIndex + 1,
      memberId: null,
      companyId: dealerIndex + 1,

      sellerName: dealerNames[dealerIndex],

      sellerPhone:
        `010-${padNumber(
          1200 + dealerIndex,
          4,
        )}-${padNumber(
          5600 + index,
          4,
        )}`,

      companyName: companyNames[dealerIndex],

      registeredDate: makeRegisteredDate(index),

      description:
        "회사 소속 딜러가 등록한 일반 중고거래 테스트 매물입니다. 일반회원 계정에서 구매 가능한 차량으로 표시됩니다.",

      options: [
        "후방카메라",
        "스마트키",
        "열선시트",
        "내비게이션",
        "차선이탈 경고",
      ],

      auction: null,
    };
  },
);

const memberCars = Array.from(
  { length: 30 },
  (_, index) => {
    const template =
      memberCarTemplates[index % memberCarTemplates.length];

    const [
      brand,
      modelName,
      baseCarName,
      fuel,
      basePrice,
    ] = template;

    const memberIndex = index % memberNames.length;

    const sequence =
      Math.floor(index / memberCarTemplates.length) + 1;

    const id = 101 + index;

    const startPrice =
      basePrice +
      sequence * 50 +
      (index % 4) * 30;

    return {
      id,

      brand,
      modelName,
      carName: `${baseCarName} 개인 경매 ${sequence}호`,

      year: 2017 + (index % 9),
      mileage: 24000 + index * 3100,
      price: startPrice,

      region:
        regions[(index + 2) % regions.length],

      sellerType: "일반회원",
      fuel,
      transmission: "자동",

      status: "경매중",
      saleType: "AUCTION",

      imageText: modelName.toUpperCase(),

      color:
        colors[(index + 1) % colors.length],

      displacement:
        fuel === "전기"
          ? "전기모터"
          : `${1598 + (index % 5) * 300}cc`,

      accident:
        index % 7 === 0
          ? "단순교환"
          : "무사고",

      carNumber: makeCarNumber(index, 7),

      dealerId: null,
      memberId: memberIndex + 1,
      companyId: null,

      sellerName: memberNames[memberIndex],

      sellerPhone:
        `010-${padNumber(
          4400 + memberIndex,
          4,
        )}-${padNumber(
          1200 + index,
          4,
        )}`,

      companyName: "개인 판매",

      registeredDate: makeRegisteredDate(index),

      description:
        "일반회원이 등록한 비공개 입찰 경매 테스트 매물입니다. 회사 또는 딜러 계정에서 입찰 가능한 차량으로 표시됩니다.",

      options: [
        "후방카메라",
        "스마트키",
        "열선핸들",
        "열선시트",
        "오토라이트",
      ],

      auction: {
        auctionId: id,
        startPrice,
        bidCount: index % 8,

        startDate:
          `2026-07-${padNumber(
            20 + (index % 8),
          )}T09:00:00`,

        endDate:
          `2026-08-${padNumber(
            1 + (index % 20),
          )}T18:00:00`,

        status: "경매중",
        winningBidPrice: null,
        winningBidderName: null,
      },
    };
  },
);

const cars = [
  ...dealerCars,
  ...memberCars,
];

export default cars;