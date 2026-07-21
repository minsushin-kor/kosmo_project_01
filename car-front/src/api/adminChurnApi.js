import {
  adminCompanyChurnUsers,
  adminDealerChurnUsers,
} from "../data/adminData";

// FastAPI 서버 기본 URL
const FASTAPI_BASE_URL = "http://localhost:8000/api/ai/predict-churn";

// FastAPI 위험 등급(risk_grade)을 리액트 UI 등급(높음/보통/낮음)으로 변환
function mapRiskGrade(riskGrade) {
  if (riskGrade === "Critical" || riskGrade === "High") {
    return "높음";
  } else if (riskGrade === "Medium") {
    return "보통";
  } else {
    return "낮음";
  }
}

// 최신 회사 5개 피처 매핑
const COMPANY_FEATURE_MAPPING = {
  1: { // 서울오토 (고위험군 이탈 확률 100.00% 유도)
    Dealer_Count: 17,
    Active_Dealer_Ratio: 0.50,
    Recent_Trade_Count: 0,
    Previous_Trade_Count: 402,
    Site_Usage_Rate_Avg: 0.50
  },
  2: { // 강남모터스 (중위험군 이탈 확률 30.18% 유도)
    Dealer_Count: 17,
    Active_Dealer_Ratio: 0.80,
    Recent_Trade_Count: 20,
    Previous_Trade_Count: 200,
    Site_Usage_Rate_Avg: 0.80
  },
  3: { // 오토플러스 (저위험군 이탈 확률 0.00% 유도)
    Dealer_Count: 17,
    Active_Dealer_Ratio: 0.88,
    Recent_Trade_Count: 350,
    Previous_Trade_Count: 400,
    Site_Usage_Rate_Avg: 0.88
  }
};

// 최신 개인 딜러 4개 피처 매핑
const DEALER_FEATURE_MAPPING = {
  1: { // 김딜러 (고위험군 이탈 확률 99.83% 유도)
    Last_Activity_Days: 180,
    Recent_60d_Trade_Count: 0,
    Previous_Trade_Count: 0,
    Site_Usage_Rate: 0.00
  },
  2: { // 이딜러 (중위험군 이탈 확률 31.18% 유도)
    Last_Activity_Days: 120,
    Recent_60d_Trade_Count: 5,
    Previous_Trade_Count: 0,
    Site_Usage_Rate: 0.20
  },
  3: { // 박딜러 (저위험군 이탈 확률 0.00% 유도)
    Last_Activity_Days: 10,
    Recent_60d_Trade_Count: 100,
    Previous_Trade_Count: 500,
    Site_Usage_Rate: 0.90
  }
};

export async function getCompanyChurnUsers() {
  try {
    const updatedUsers = await Promise.all(
      adminCompanyChurnUsers.map(async (user) => {
        const features = COMPANY_FEATURE_MAPPING[user.id];
        if (!features) return user;

        const response = await fetch(`${FASTAPI_BASE_URL}/company`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(features),
        });

        if (!response.ok) {
          throw new Error("FastAPI 호출 실패");
        }

        const result = await response.json();
        if (result.status === "success") {
          return {
            ...user,
            churnRate: `${Math.round(result.churn_probability_percent)}%`,
            risk: mapRiskGrade(result.risk_grade),
          };
        }
        return user;
      })
    );
    return updatedUsers;
  } catch (error) {
    console.warn("회사 이탈 위험 FastAPI 연동 실패, 임시 데이터 사용:", error);
    return adminCompanyChurnUsers;
  }
}

export async function getDealerChurnUsers() {
  try {
    const updatedUsers = await Promise.all(
      adminDealerChurnUsers.map(async (user) => {
        const features = DEALER_FEATURE_MAPPING[user.id];
        if (!features) return user;

        const response = await fetch(`${FASTAPI_BASE_URL}/individual`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(features),
        });

        if (!response.ok) {
          throw new Error("FastAPI 호출 실패");
        }

        const result = await response.json();
        if (result.status === "success") {
          return {
            ...user,
            churnRate: `${Math.round(result.churn_probability_percent)}%`,
            risk: mapRiskGrade(result.risk_grade),
          };
        }
        return user;
      })
    );
    return updatedUsers;
  } catch (error) {
    console.warn("딜러 이탈 위험 FastAPI 연동 실패, 임시 데이터 사용:", error);
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
  return {
    success: true,
    churnType,
    targetId,
    action,
    status,
    memo,
  };
}