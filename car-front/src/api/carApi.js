const API_BASE_URL = "http://localhost:8080/api";

export async function registerCar(formData) {
  const response = await fetch(`${API_BASE_URL}/cars`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("매물 등록 실패");
  }

  return response.json();
}

export async function getCarList() {
  const response = await fetch(`${API_BASE_URL}/cars`);

  if (!response.ok) {
    throw new Error("매물 목록 조회 실패");
  }

  return response.json();
}

export async function getCarDetail(carId) {
  const response = await fetch(`${API_BASE_URL}/cars/${carId}`);

  if (!response.ok) {
    throw new Error("매물 상세 조회 실패");
  }

  return response.json();
}

export async function updateCar(carId, formData) {
  const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("매물 수정 실패");
  }

  return response.json();
}

export async function deleteCar(carId) {
  const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("매물 삭제 실패");
  }

  return response.json();
}