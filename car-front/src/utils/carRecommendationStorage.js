const RECENT_CAR_STORAGE_KEY =
  "car_front_recent_car_ids";

const RECENT_CAR_LIMIT = 6;

function readRecentCarIds() {
  try {
    const savedIds = JSON.parse(
      localStorage.getItem(
        RECENT_CAR_STORAGE_KEY
      ) || "[]"
    );

    return Array.isArray(savedIds)
      ? savedIds.map(Number)
      : [];
  } catch {
    localStorage.removeItem(
      RECENT_CAR_STORAGE_KEY
    );

    return [];
  }
}

export function getRecentCarIds() {
  return readRecentCarIds();
}

export function saveRecentCarId(carId) {
  const numericCarId = Number(carId);

  if (!numericCarId) {
    return;
  }

  const nextIds = [
    numericCarId,
    ...readRecentCarIds().filter(
      (id) => id !== numericCarId
    ),
  ].slice(0, RECENT_CAR_LIMIT);

  localStorage.setItem(
    RECENT_CAR_STORAGE_KEY,
    JSON.stringify(nextIds)
  );

  window.dispatchEvent(
    new Event("recent-car-change")
  );
}

export function clearRecentCarIds() {
  localStorage.removeItem(
    RECENT_CAR_STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("recent-car-change")
  );
}

function normalizeKeyword(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getPreferenceKeywords(loginUser) {
  return String(loginUser?.preferredCar || "")
    .split(/[\s,/]+/)
    .map(normalizeKeyword)
    .filter(Boolean);
}

function getSimilarityScore(
  car,
  recentCars,
  preferenceKeywords
) {
  let score = 0;

  const carWords = [
    car.brand,
    car.modelName,
    car.carName,
    car.fuel,
    car.body,
    car.region,
  ].map(normalizeKeyword);

  preferenceKeywords.forEach((keyword) => {
    if (
      carWords.some((word) =>
        word.includes(keyword)
      )
    ) {
      score += 6;
    }
  });

  recentCars.forEach(
    (recentCar, index) => {
      const recentWeight = Math.max(
        1,
        5 - index
      );

      if (car.brand === recentCar.brand) {
        score += 5 * recentWeight;
      }

      if (
        car.modelName ===
        recentCar.modelName
      ) {
        score += 7 * recentWeight;
      }

      if (car.fuel === recentCar.fuel) {
        score += 2 * recentWeight;
      }

      if (
        car.region === recentCar.region
      ) {
        score += recentWeight;
      }

      const recentPrice = Number(
        recentCar.price || 0
      );

      const currentPrice = Number(
        car.price || 0
      );

      if (
        recentPrice > 0 &&
        Math.abs(
          currentPrice - recentPrice
        ) <=
        recentPrice * 0.25
      ) {
        score += 3 * recentWeight;
      }
    }
  );

  return score;
}

export function getRecentCars(allCars) {
  const carMap = new Map(
    allCars.map((car) => [
      Number(car.id),
      car,
    ])
  );

  return readRecentCarIds()
    .map((id) => carMap.get(id))
    .filter(Boolean);
}

export function getRecommendedCars({
  candidateCars,
  allCars,
  loginUser,
  limit = 4,
}) {
  const recentCars =
    getRecentCars(allCars);

  const recentIds = new Set(
    recentCars.map((car) =>
      Number(car.id)
    )
  );

  const preferenceKeywords =
    getPreferenceKeywords(loginUser);

  return candidateCars
    .filter(
      (car) =>
        !recentIds.has(Number(car.id))
    )
    .map((car) => ({
      car,
      score: getSimilarityScore(
        car,
        recentCars,
        preferenceKeywords
      ),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        new Date(
          b.car.registeredDate
        ) -
        new Date(
          a.car.registeredDate
        )
      );
    })
    .slice(0, limit)
    .map(({ car }) => car);
}