const VEHICLE_MAKE_KOREAN_MAP = {
  bmw: "BMW",
  cadillac: "캐딜락",
  chevrolet: "쉐보레",
  chrysler: "크라이슬러",
  ford: "포드",
  gmc: "GMC",
  honda: "혼다",
  hyundai: "현대",
  infiniti: "인피니티",
  jaguar: "재규어",
  kia: "기아",
  mazda: "마쓰다",
  "mercedes-benz": "벤츠",
  mini: "미니",
  mitsubishi: "미쓰비시",
  nissan: "닛산",
  toyota: "토요타",
  volkswagen: "폭스바겐",
};

const VEHICLE_MODEL_KOREAN_MAP = {
  "3 series": "3시리즈",
  acadia: "아카디아",
  accord: "어코드",
  altima: "알티마",
  camry: "캠리",
  "c-class": "C-클래스",
  civic: "시빅",
  "cla-class": "CLA-클래스",
  "cooper countryman": "쿠퍼 컨트리맨",
  corolla: "코롤라",
  cruze: "크루즈",
  "cr-v": "CR-V",
  cts: "CTS",
  "cx-9": "CX-9",
  elantra: "아반떼",
  escape: "이스케이프",
  "explorer sport trac": "익스플로러 스포츠 트랙",
  "f-150": "F-150",
  "g sedan": "G 세단",
  lancer: "랜서",
  mazda3: "마쓰다3",
  passat: "파사트",
  "pt cruiser": "PT 크루저",
  qx4: "QX4",
  rogue: "로그",
  s2000: "S2000",
  "silverado 1500": "실버라도 1500",
  sonata: "쏘나타",
  sorento: "쏘렌토",
  taurus: "토러스",
  x5: "X5",
  xj: "XJ",
  "xj-series": "XJ 시리즈",
  xts: "XTS",
};

function normalizeLookupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function replaceFirstIgnoreCase(source, search, replacement) {
  const sourceText = String(source || "");
  const searchText = String(search || "").trim();

  if (!sourceText || !searchText || searchText === replacement) {
    return sourceText;
  }

  const index = sourceText
    .toLowerCase()
    .indexOf(searchText.toLowerCase());

  if (index < 0) {
    return sourceText;
  }

  return (
    sourceText.slice(0, index) +
    replacement +
    sourceText.slice(index + searchText.length)
  );
}

export function toKoreanVehicleMake(value) {
  const originalValue = String(value || "").trim();

  return (
    VEHICLE_MAKE_KOREAN_MAP[
      normalizeLookupKey(originalValue)
    ] || originalValue
  );
}

export function toKoreanVehicleModel(value) {
  const originalValue = String(value || "").trim();

  return (
    VEHICLE_MODEL_KOREAN_MAP[
      normalizeLookupKey(originalValue)
    ] || originalValue
  );
}

export function toKoreanVehicleName({
  make,
  model,
  name,
} = {}) {
  const rawMake = String(make || "").trim();
  const rawModel = String(model || "").trim();
  const koreanMake = toKoreanVehicleMake(rawMake);
  const koreanModel = toKoreanVehicleModel(rawModel);
  const fallbackName = `${koreanMake} ${koreanModel}`.trim();
  const originalName = String(name || "").trim();

  if (!originalName) {
    return fallbackName;
  }

  return replaceFirstIgnoreCase(
    replaceFirstIgnoreCase(
      originalName,
      rawMake,
      koreanMake
    ),
    rawModel,
    koreanModel
  );
}
