const DEALER_CAR_STORAGE_KEY = "dealerCars";

export function getDealerCarsFromStorage() {
  const savedCars = localStorage.getItem(DEALER_CAR_STORAGE_KEY);

  if (!savedCars) {
    return [];
  }

  return JSON.parse(savedCars);
}

export function saveDealerCarToStorage(carData) {
  const savedCars = getDealerCarsFromStorage();

  const nextCars = [carData, ...savedCars];

  localStorage.setItem(DEALER_CAR_STORAGE_KEY, JSON.stringify(nextCars));
}

export function deleteDealerCarFromStorage(carId) {
  const savedCars = getDealerCarsFromStorage();

  const nextCars = savedCars.filter((car) => car.id !== carId);

  localStorage.setItem(DEALER_CAR_STORAGE_KEY, JSON.stringify(nextCars));
}