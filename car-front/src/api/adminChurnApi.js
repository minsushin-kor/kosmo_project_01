import {
  adminCompanyChurnUsers,
  adminDealerChurnUsers,
} from "../data/adminData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function requestApi(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("API 주소가 설정되지 않았습니다.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("API 요청에 실패했습니다.");
  }

  return response.json();
}

export async function getCompanyChurnUsers() {
  try {
    return await requestApi("/api/admin/churn/company");
  } catch (error) {
    console.warn("회사 이탈 위험 API 대신 임시데이터 사용", error);
    return adminCompanyChurnUsers;
  }
}

export async function getDealerChurnUsers() {
  try {
    return await requestApi("/api/admin/churn/dealer");
  } catch (error) {
    console.warn("딜러 이탈 위험 API 대신 임시데이터 사용", error);
    return adminDealerChurnUsers;
  }
}

export async function updateChurnAction({
  churnType,
  targetId,
  action,
  status,
  memo,
}) {
  try {
    // 실제 API 연결 위치
    // 예시 주소
    // PATCH /api/admin/churn/company/1/action
    // PATCH /api/admin/churn/dealer/1/action
    return await requestApi(`/api/admin/churn/${churnType}/${targetId}/action`, {
      method: "PATCH",
      body: JSON.stringify({
        action,
        status,
        memo,
      }),
    });
  } catch (error) {
    console.warn("이탈방지 처리 API 대신 화면에서만 상태 변경", error);
    return {
      success: true,
      action,
      status,
      memo,
    };
  }
}