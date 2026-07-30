import apiClient from "./apiClient";

function mapRiskGrade(
  riskGrade,
  riskScore,
  threshold
) {
  if (
    riskScore === null ||
    riskScore === undefined ||
    riskScore === ""
  ) {
    return "미계산";
  }

  const normalizedGrade =
    String(riskGrade || "").toUpperCase();

  if (
    normalizedGrade === "CRITICAL" ||
    normalizedGrade === "HIGH" ||
    normalizedGrade === "CARE_REQUIRED"
  ) {
    return "높음";
  }

  if (normalizedGrade === "MEDIUM") {
    return "보통";
  }

  if (
    normalizedGrade === "LOW" ||
    normalizedGrade === "SAFE" ||
    normalizedGrade === "NORMAL"
  ) {
    return "낮음";
  }

  const score = Number(riskScore);

  if (!Number.isFinite(score)) {
    return "미계산";
  }

  if (score >= threshold) {
    return "높음";
  }

  if (score >= 40) {
    return "보통";
  }

  return "낮음";
}

function formatRiskScore(riskScore) {
  if (
    riskScore === null ||
    riskScore === undefined ||
    riskScore === ""
  ) {
    return "미계산";
  }

  const score = Number(riskScore);

  if (!Number.isFinite(score)) {
    return "미계산";
  }

  return `${score.toFixed(2)}%`;
}

function formatCalculatedAt(calculatedAt) {
  if (!calculatedAt) {
    return "미계산";
  }

  const date = new Date(calculatedAt);

  if (Number.isNaN(date.getTime())) {
    return String(calculatedAt);
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}

function normalizeReason(riskReasons) {
  if (Array.isArray(riskReasons)) {
    return riskReasons.join(", ");
  }

  return (
    riskReasons ||
    "활동 특이사항 없음"
  );
}

function mapCouponStatus(couponStatus) {
  const status = String(
    couponStatus || ""
  ).toUpperCase();

  const statusLabels = {
    ELIGIBLE: "지급 가능",
    UNUSED: "보유 중",
    USED: "사용 완료",
    EXPIRED: "기간 만료",
    NOT_ELIGIBLE: "대상 아님",
  };

  return statusLabels[status] ||
    "정보 없음";
}

function mapCompanyChurnUser(company) {
  return {
    id: company.companyId,
    type: "회사",
    memberType: "회사",
    name:
      company.companyName ||
      `회사 ${company.companyId}`,
    calculatedAt: formatCalculatedAt(
      company.calculatedAt
    ),
    churnRate: formatRiskScore(
      company.riskScore
    ),
    risk: mapRiskGrade(
      company.riskGrade,
      company.riskScore,
      70
    ),
    action:
      company.action || "모니터링",
    reason: normalizeReason(
      company.riskReasons
    ),
  };
}

function mapDealerChurnUser(dealer) {
  return {
    id: dealer.dealerId,
    type: "개인딜러",
    memberType: "개인딜러",
    name:
      dealer.name ||
      dealer.loginId ||
      `딜러 ${dealer.dealerId}`,
    calculatedAt: formatCalculatedAt(
      dealer.calculatedAt
    ),
    churnRate: formatRiskScore(
      dealer.riskScore
    ),
    risk: mapRiskGrade(
      dealer.riskGrade,
      dealer.riskScore,
      75
    ),
    action:
      dealer.action || "모니터링",
    reason: normalizeReason(
      dealer.riskReasons
    ),
    couponStatus: mapCouponStatus(
      dealer.couponStatus
    ),
    couponEligible: Boolean(
      dealer.couponEligible
    ),
  };
}

function requireArray(data, label) {
  if (!Array.isArray(data)) {
    throw new Error(
      `${label} 이탈 위험 목록 응답 형식이 올바르지 않습니다.`
    );
  }

  return data;
}

export async function getCompanyChurnUsers() {
  const companies = await apiClient.get(
    "/admin/ai/churn-companies"
  );

  return requireArray(
    companies,
    "회사"
  ).map(mapCompanyChurnUser);
}

export async function getDealerChurnUsers() {
  const dealers = await apiClient.get(
    "/admin/ai/churn-dealers"
  );

  return requireArray(
    dealers,
    "딜러"
  ).map(mapDealerChurnUser);
}

export async function runChurnBatch() {
  return apiClient.post(
    "/admin/ai/churn-batch",
    null,
    {
      timeout: 120000,
    }
  );
}

export async function issueChurnRiskCoupons() {
  return apiClient.post(
    "/admin/coupons/churn-risk/batch",
    null,
    {
      timeout: 60000,
    }
  );
}
