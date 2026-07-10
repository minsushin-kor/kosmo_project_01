import cars from "../data/cars";
import { getDealerCarsFromStorage } from "./dealerCarStorage";

export function normalizeCar(car) {
  if (!car) {
    return null;
  }

  const carName =
    car.carName ||
    car.name ||
    `${car.make || car.brand || ""} ${car.model || car.modelName || ""}`.trim();

  const brand = car.brand || car.make || "-";
  const modelName = car.modelName || car.model || "-";
  const mileage = Number(car.mileage || car.odometer || 0);
  const price = Number(car.price || car.sellingprice || car.auction?.startPrice || 0);

  const isDealerCar = Boolean(car.dealerId) && !car.memberId;
  const isMemberCar = Boolean(car.memberId) && !car.dealerId;
  const saleType = car.saleType || (isMemberCar ? "AUCTION" : "NORMAL");

  const auction =
    saleType === "AUCTION"
      ? car.auction || {
          auctionId: car.id,
          startPrice: price,
          bidCount: 0,
          startDate: car.createdAt || car.registeredDate || new Date().toISOString(),
          endDate: null,
          status: car.status || "경매중",
          winningBidPrice: null,
          winningBidderName: null,
        }
      : null;

  return {
    ...car,

    carName,
    name: car.name || carName,

    brand,
    make: car.make || brand,

    modelName,
    model: car.model || modelName,

    mileage,
    odometer: Number(car.odometer || mileage),

    price,
    sellingprice: Number(car.sellingprice || price),

    region: car.region || car.state || "-",
    state: car.state || car.region || "-",

    fuel: car.fuel || "-",
    transmission: car.transmission || "-",

    status:
      car.status ||
      auction?.status ||
      (saleType === "AUCTION" ? "경매중" : "판매중"),

    imageText: car.imageText || modelName || "CAR",

    color: car.color || "-",
    displacement: car.displacement || "-",
    accident: car.accident || "-",
    carNumber: car.carNumber || "-",

    sellerType: car.sellerType || (isDealerCar ? "회사딜러" : "일반회원"),
    sellerName: car.sellerName || (isDealerCar ? "딜러" : "일반회원"),
    sellerPhone: car.sellerPhone || "010-0000-0000",
    companyName: isDealerCar ? car.companyName || "소속 회사" : "개인 판매",

    dealerId: car.dealerId ?? null,
    memberId: car.memberId ?? null,
    companyId: car.companyId ?? null,

    saleType,

    registeredDate:
      car.registeredDate ||
      car.createdAt ||
      new Date().toISOString().slice(0, 10),

    description:
      car.description ||
      (saleType === "AUCTION"
        ? "일반회원이 등록한 경매 차량입니다."
        : "회사 소속 딜러가 등록한 일반 판매 차량입니다."),

    options: Array.isArray(car.options)
      ? car.options
      : Array.isArray(car.option)
      ? car.option
      : typeof car.option === "string" && car.option.length > 0
      ? car.option.split(",").map((item) => item.trim())
      : [],

    auction,
  };
}

export function getAllCars() {
  const storageCars = getDealerCarsFromStorage();

  return [...storageCars, ...cars].map((car) => normalizeCar(car));
}

export function getCarById(carId) {
  return getAllCars().find((car) => car.id === Number(carId));
}
