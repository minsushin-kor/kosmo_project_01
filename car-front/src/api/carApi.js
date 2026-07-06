const API_BASE_URL = "http://localhost:8080/api";

export async function registerCar(carData) {
  const response = await fetch(`${API_BASE_URL}/dealer/cars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(carData),
  });

  if (!response.ok) {
    throw new Error("매물 등록에 실패했습니다.");
  }

  return response.json();
}

// 매물 목록 조회
export async function getCarList() {}

// 매물 상세 조회
export async function getCarDetail(carId) {}

// 매물 수정
export async function updateCar(carId, carData) {}

// 매물 삭제
export async function deleteCar(carId) {}