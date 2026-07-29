import apiClient from "./apiClient";

/**
 * 백엔드 차량 상태를 프론트 화면 문구로 변환합니다.
 */
function mapCarStatus(status, saleType) {
  const normalizedStatus = String(
    status || ""
  ).toUpperCase();

  const statusMap = {
    REGISTERED:
      saleType === "AUCTION"
        ? "경매중"
        : "판매중",

    ACTIVE: "경매중",
    BIDDING: "경매중",
    RESERVED: "상담중",
    COUNSELING: "상담중",
    SOLD: "판매완료",
    COMPLETED: "거래완료",
    DELETED: "삭제",
  };

  return (
    statusMap[normalizedStatus] ||
    status ||
    (
      saleType === "AUCTION"
        ? "경매중"
        : "판매중"
    )
  );
}

/**
 * 백엔드 차량 응답을 기존 프론트 차량 구조로 변환합니다.
 *
 * 기존 CarCard, 상세 페이지, 검색 기능에서
 * id, brand, modelName, mileage, price 등을 사용하기 때문에
 * 백엔드 필드와 프론트 필드를 함께 제공합니다.
 */
export function mapServerCarToClientCar(
  serverCar
) {
  if (!serverCar) {
    return null;
  }

  const carId =
    serverCar.carId ??
    serverCar.id ??
    null;

  const make =
    serverCar.make ||
    serverCar.brand ||
    "";

  const model =
    serverCar.model ||
    serverCar.modelName ||
    "";

  const saleType =
    serverCar.saleType ||
    (
      serverCar.ownerType === "MEMBER"
        ? "AUCTION"
        : "NORMAL"
    );

  const ownerType =
    serverCar.ownerType ||
    (
      saleType === "AUCTION"
        ? "MEMBER"
        : "DEALER"
    );

  const isMemberCar =
    ownerType === "MEMBER" ||
    saleType === "AUCTION";

  const isDealerCar =
    ownerType === "DEALER" ||
    saleType === "NORMAL";

  const sellingPrice = Number(
    serverCar.sellingPrice ??
    serverCar.price ??
    0
  );

  const mileage = Number(
    serverCar.odometer ??
    serverCar.mileage ??
    0
  );

  const images = Array.isArray(
    serverCar.images
  )
    ? serverCar.images
    : [];

  const mainImage =
    images.find(
      (image) =>
        image?.isMain === true
    ) ||
    images[0] ||
    null;

  const auction =
    saleType === "AUCTION"
      ? {
        auctionId:
          serverCar.auctionId ??
          null,

        startPrice:
          sellingPrice,

        bidCount:
          Number(
            serverCar.bidCount ??
            0
          ),

        startDate:
          serverCar.startTime ||
          serverCar.createdAt ||
          null,

        endDate:
          serverCar.endTime ||
          null,

        status:
          mapCarStatus(
            serverCar.auctionStatus ||
            serverCar.status,
            saleType
          ),

        winningBidPrice: null,
        winningBidderName: null,
      }
      : null;

  const sellerType =
    serverCar.sellerType ||
    (
      isMemberCar
        ? "일반회원"
        : "회사딜러"
    );

  return {
    ...serverCar,

    // 기존 프론트 공통 차량 ID
    id: carId,
    carId,

    year:
      Number(
        serverCar.year || 0
      ),

    make,
    brand: make,

    model,
    modelName: model,

    carName:
      serverCar.carName ||
      `${make} ${model}`.trim(),

    name:
      serverCar.name ||
      `${make} ${model}`.trim(),

    option:
      serverCar.option || "",

    options:
      typeof serverCar.option ===
        "string" &&
        serverCar.option.trim()
        ? serverCar.option
          .split(",")
          .map((item) =>
            item.trim()
          )
          .filter(Boolean)
        : [],

    body:
      serverCar.body || "-",

    transmission:
      serverCar.transmission ||
      "-",

    state:
      serverCar.state || "-",

    region:
      serverCar.state || "-",

    condition:
      serverCar.condition ??
      null,

    odometer: mileage,
    mileage,

    color:
      serverCar.color || "-",

    interior:
      serverCar.interior ||
      "-",

    mmr:
      serverCar.mmr ??
      null,

    sellingPrice,
    sellingprice:
      sellingPrice,

    /*
     * 현재 기존 화면은 가격 뒤에 '만원'을 표시합니다.
     * 백엔드 sellingPrice도 현재 입력 폼과 동일하게
     * 만원 단위로 사용합니다.
     */
    price:
      sellingPrice,

    saleType,

    ownerType,

    ownerId:
      serverCar.ownerId ??
      null,

    ownerName:
      serverCar.ownerName ||
      "",

    sellerType,

    sellerName:
      serverCar.ownerName ||
      serverCar.sellerName ||
      (
        isMemberCar
          ? "일반회원"
          : "딜러"
      ),

    sellerPhone:
      serverCar.sellerPhone ||
      "",

    memberId:
      isMemberCar
        ? serverCar.ownerId ??
        null
        : null,

    dealerId:
      isDealerCar
        ? serverCar.ownerId ??
        null
        : null,

    companyId:
      serverCar.companyId ??
      null,

    companyName:
      serverCar.companyName ||
      "",

    status:
      mapCarStatus(
        serverCar.status,
        saleType
      ),

    registeredDate:
      serverCar.createdAt ||
      "",

    createdAt:
      serverCar.createdAt ||
      "",

    imageUrl:
      mainImage?.imageUrl ||
      "",

    imageText:
      model || "CAR",

    images,

    auction,

    auctionId:
      serverCar.auctionId ??
      null,

    startTime:
      serverCar.startTime ||
      null,

    endTime:
      serverCar.endTime ||
      null,

    auctionStatus:
      serverCar.auctionStatus ||
      "",

    bidCount:
      Number(
        serverCar.bidCount ??
        0
      ),

    goldenBadgeStatus:
      Boolean(
        serverCar.goldenBadgeStatus
      ),

    description:
      saleType === "AUCTION"
        ? "일반회원이 등록한 경매 차량입니다."
        : "회사 소속 딜러가 등록한 일반 판매 차량입니다.",
  };
}

/**
 * 차량 목록을 조회합니다.
 *
 * 백엔드가 Spring Page 형식으로 반환하므로
 * content와 페이지 정보를 분리해 반환합니다.
 */
export async function getCarList({
  make = "",
  model = "",
  transmission = "",
  state = "",
  status = "",
  minPrice = null,
  maxPrice = null,
  minYear = null,
  maxYear = null,
  page = 0,
  size = 100,
  sortBy = "createdAt",
  direction = "desc",
} = {}) {
  const params = {
    page,
    size,
    sortBy,
    direction,
  };

  if (make) {
    params.make = make;
  }

  if (model) {
    params.model = model;
  }

  if (transmission) {
    params.transmission =
      transmission;
  }

  if (state) {
    params.state = state;
  }

  if (status) {
    params.status = status;
  }

  if (minPrice !== null) {
    params.minPrice =
      minPrice;
  }

  if (maxPrice !== null) {
    params.maxPrice =
      maxPrice;
  }

  if (minYear !== null) {
    params.minYear =
      minYear;
  }

  if (maxYear !== null) {
    params.maxYear =
      maxYear;
  }

  const response =
    await apiClient.get(
      "/cars",
      {
        params,
      }
    );

  const content =
    Array.isArray(response)
      ? response
      : response?.content || [];

  return {
    cars:
      content
        .map(
          mapServerCarToClientCar
        )
        .filter(Boolean),

    page:
      response?.number ??
      page,

    size:
      response?.size ??
      size,

    totalElements:
      response?.totalElements ??
      content.length,

    totalPages:
      response?.totalPages ??
      (
        content.length > 0
          ? 1
          : 0
      ),

    first:
      response?.first ??
      true,

    last:
      response?.last ??
      true,
  };
}

/**
 * 차량 상세정보를 조회합니다.
 */
export async function getCarDetail(
  carId
) {
  if (!carId) {
    throw new Error(
      "차량 ID가 필요합니다."
    );
  }

  const response =
    await apiClient.get(
      `/cars/${carId}`
    );

  return mapServerCarToClientCar(
    response
  );
}

/**
 * 차량을 등록합니다.
 *
 * 현재 백엔드는 @RequestBody JSON을 사용하므로
 * FormData가 아닌 일반 객체를 전송해야 합니다.
 */
export async function registerCar(
  requestData
) {
  const response =
    await apiClient.post(
      "/cars",
      requestData
    );

  return mapServerCarToClientCar(
    response
  );
}

/**
 * 차량 정보를 수정합니다.
 */
export async function updateCar(
  carId,
  requestData
) {
  if (!carId) {
    throw new Error(
      "수정할 차량 ID가 필요합니다."
    );
  }

  const response =
    await apiClient.put(
      `/cars/${carId}`,
      requestData
    );

  return mapServerCarToClientCar(
    response
  );
}

/**
 * 차량을 삭제 처리합니다.
 */
export async function deleteCar(
  carId
) {
  if (!carId) {
    throw new Error(
      "삭제할 차량 ID가 필요합니다."
    );
  }

  return apiClient.delete(
    `/cars/${carId}`
  );
}

/**
 * 일반회원이 딜러 차량을 즉시 구매합니다.
 */
export async function purchaseCar(
  carId
) {
  if (!carId) {
    throw new Error(
      "구매할 차량 ID가 필요합니다."
    );
  }

  return apiClient.post(
    `/cars/${carId}/purchase`
  );
}

/**
 * 일반회원에게 추천할 수 있는
 * 전체 딜러 차량 목록을 조회합니다.
 */
export async function getBuyerRecommendationCandidates() {
  const response =
    await apiClient.get(
      "/cars/buyer-recommendation-candidates"
    );

  const cars =
    Array.isArray(response)
      ? response
      : [];

  return cars
    .map(
      mapServerCarToClientCar
    )
    .filter(Boolean);
}

/**
 * 현재 로그인한 일반회원 또는 딜러가
 * 직접 등록한 차량 목록을 조회합니다.
 */
export async function getMyCars() {
  const response =
    await apiClient.get(
      "/cars/my"
    );

  const carList =
    Array.isArray(response)
      ? response
      : [];

  return carList
    .map(
      mapServerCarToClientCar
    )
    .filter(Boolean);
}