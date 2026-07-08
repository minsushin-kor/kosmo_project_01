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

  const auction = car.auction || {
    auctionId: car.id,
    startPrice: price,
    bidCount: 0,
    startDate: car.createdAt || car.registeredDate || new Date().toISOString(),
    endDate: null,
    status: car.status || "경매중",
    winningBidPrice: null,
    winningBidderName: null,
  };

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

    status: auction.status || car.status || "경매중",

    imageText: car.imageText || modelName || "CAR",

    color: car.color || "-",
    displacement: car.displacement || "-",
    accident: car.accident || "-",
    carNumber: car.carNumber || "-",

    sellerType: car.sellerType || "딜러",
    sellerName: car.sellerName || "김딜러",
    sellerPhone: car.sellerPhone || "010-1234-5678",
    companyName: car.companyName || "Kosmo 인증모터스",

    dealerId: car.dealerId ?? 1,
    memberId: car.memberId ?? null,
    companyId: car.companyId ?? 1,

    registeredDate:
      car.registeredDate ||
      car.createdAt ||
      new Date().toISOString().slice(0, 10),

    description: car.description || "등록된 경매 차량입니다.",

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