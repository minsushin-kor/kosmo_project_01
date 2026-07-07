import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  getCompanyChurnUsers,
  getDealerChurnUsers,
} from "../../api/adminChurnApi";
import "../../css/admin/adminDashboardPage.css";

const FASTAPI_BASE_URL = "http://localhost:8000/api/ai/predict-churn";

function RangeInput({ label, name, value, min, max, step = "1", unit, onChange }) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
        <span>{label}</span>
        <span style={{ color: "#3b82f6" }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{ width: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

function getRiskDetails(riskGrade) {
  if (riskGrade === "Critical" || riskGrade === "High") {
    return { text: "이탈 위험 높음", color: "#f43f5e", bg: "#fff1f2", level: "high" };
  } else if (riskGrade === "Medium") {
    return { text: "이탈 위험 보통", color: "#f59e0b", bg: "#fef3c7", level: "medium" };
  } else {
    return { text: "이탈 위험 낮음", color: "#10b981", bg: "#ecfdf5", level: "low" };
  }
}

function AdminChurnManagePage({ churnType }) {
  const [companyChurnUsers, setCompanyChurnUsers] = useState([]);
  const [dealerChurnUsers, setDealerChurnUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 최신 회사 5개 피처 입력 스펙에 맞춤형 초기화
  const [companyForm, setCompanyForm] = useState({
    Dealer_Count: 17,
    Active_Dealer_Ratio: 0.80,
    Recent_Trade_Count: 20,
    Previous_Trade_Count: 200,
    Site_Usage_Rate_Avg: 0.80,
  });

  // 최신 개인 딜러 4개 피처 입력 스펙에 맞춤형 초기화
  const [dealerForm, setDealerForm] = useState({
    Last_Activity_Days: 120,
    Recent_60d_Trade_Count: 5,
    Previous_Trade_Count: 0,
    Site_Usage_Rate: 0.20,
  });

  const [predictLoading, setPredictLoading] = useState(false);
  const [predictResult, setPredictResult] = useState(null);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    fetchChurnData();
    setPredictResult(null);
    setPredictError(null);
  }, [churnType]);

  const fetchChurnData = async () => {
    setLoading(true);
    try {
      if (churnType === "company") {
        const companyData = await getCompanyChurnUsers();
        setCompanyChurnUsers(companyData);
      } else {
        const dealerData = await getDealerChurnUsers();
        setDealerChurnUsers(dealerData);
      }
    } catch (error) {
      console.error("이탈 위험 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    
    if (churnType === "company") {
      setCompanyForm((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setDealerForm((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictResult(null);
    setPredictError(null);

    const isCompany = churnType === "company";
    const endpoint = isCompany ? `${FASTAPI_BASE_URL}/company` : `${FASTAPI_BASE_URL}/individual`;
    
    // 데이터 형 변환 정합 (Pydantic int vs float 매칭)
    const payload = isCompany 
      ? {
          Dealer_Count: Math.round(companyForm.Dealer_Count),
          Active_Dealer_Ratio: Number(companyForm.Active_Dealer_Ratio),
          Recent_Trade_Count: Math.round(companyForm.Recent_Trade_Count),
          Previous_Trade_Count: Math.round(companyForm.Previous_Trade_Count),
          Site_Usage_Rate_Avg: Number(companyForm.Site_Usage_Rate_Avg)
        }
      : {
          Last_Activity_Days: Math.round(dealerForm.Last_Activity_Days),
          Recent_60d_Trade_Count: Math.round(dealerForm.Recent_60d_Trade_Count),
          Previous_Trade_Count: Math.round(dealerForm.Previous_Trade_Count),
          Site_Usage_Rate: Number(dealerForm.Site_Usage_Rate)
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`FastAPI 예측 실패 (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "예측 처리가 비정상적입니다.");
      }

      setPredictResult(data);
    } catch (err) {
      console.error(err);
      setPredictError(err.message);
    } finally {
      setPredictLoading(false);
    }
  };

  const companyChurnColumns = [
    {
      key: "memberType",
      label: "회원유형",
      render: (member) => member.memberType || member.type,
    },
    {
      key: "name",
      label: "회사명",
    },
    {
      key: "recentActivity",
      label: "최근활동",
    },
    {
      key: "churnRate",
      label: "이탈확률",
    },
    {
      key: "risk",
      label: "위험등급",
      render: (member) => (
        <span className={`admin-risk ${member.risk}`}>{member.risk}</span>
      ),
    },
    {
      key: "action",
      label: "관리상태",
    },
    {
      key: "reason",
      label: "위험 감지 사유",
    }
  ];

  const dealerChurnColumns = [
    {
      key: "memberType",
      label: "회원유형",
      render: (member) => member.memberType || member.type,
    },
    {
      key: "name",
      label: "딜러명",
    },
    {
      key: "recentActivity",
      label: "최근활동",
    },
    {
      key: "churnRate",
      label: "이탈확률",
    },
    {
      key: "risk",
      label: "위험등급",
      render: (member) => (
        <span className={`admin-risk ${member.risk}`}>{member.risk}</span>
      ),
    },
    {
      key: "action",
      label: "관리상태",
    },
    {
      key: "reason",
      label: "위험 감지 사유",
    }
  ];

  const isCompany = churnType === "company";

  return (
    <AdminLayout
      title={isCompany ? "회사 이탈 위험 관리" : "딜러 이탈 위험 관리"}
      description={
        isCompany
          ? "회사/상사 계정 기준 Gradient Boosting AI 이탈 확률 예측 결과 및 위험 등급입니다."
          : "개인 딜러 기준 AI 이탈 확률 예측 결과 및 최근 활동 유지율 분석 등급입니다."
      }
      actions={
        <>
          <button type="button" className="admin-outline-btn" onClick={fetchChurnData}>
            🔄 목록 새로고침
          </button>
        </>
      }
    >
      <div className="admin-split-layout" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        
        {/* 좌측: 리스트 테이블 패널 */}
        <section className="admin-churn-dashboard-grid" style={{ gridTemplateColumns: "1fr", margin: 0 }}>
          {loading ? (
            <div className="admin-panel" style={{ textAlign: "center", padding: "3rem" }}>
              <p>실시간 AI 모델 예측 데이터 수신 중...</p>
            </div>
          ) : isCompany ? (
            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>회사 이탈 위험 회원 리스트</h3>
                  <p>FastAPI 서버와 실시간 통신을 거친 최신 이탈률 정보입니다.</p>
                </div>
              </div>

              <AdminTable
                columns={companyChurnColumns}
                data={companyChurnUsers}
                emptyMessage="조회된 회사 이탈 위험 데이터가 없습니다."
              />
            </article>
          ) : (
            <article className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>딜러 이탈 위험 회원 리스트</h3>
                  <p>FastAPI 서버와 실시간 통신을 거친 최신 이탈률 정보입니다.</p>
                </div>
              </div>

              <AdminTable
                columns={dealerChurnColumns}
                data={dealerChurnUsers}
                emptyMessage="조회된 딜러 이탈 위험 데이터가 없습니다."
              />
            </article>
          )}
        </section>

        {/* 우측: 실시간 AI 모의 예측기 폼 */}
        <aside className="admin-panel" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🔮 {isCompany ? "회사" : "딜러"} 실시간 이탈 예측기
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1.25rem 0", lineHeight: "1.4" }}>
            모델 피처값을 직접 조정하여 이탈 위험 단계 및 가중 확률을 즉석에서 시뮬레이션할 수 있습니다.
          </p>

          <form onSubmit={handlePredict}>
            {isCompany ? (
              <div>
                <RangeInput
                  label="소속 딜러 수"
                  name="Dealer_Count"
                  value={companyForm.Dealer_Count}
                  min="1"
                  max="100"
                  unit="명"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="활동 딜러 비율"
                  name="Active_Dealer_Ratio"
                  value={companyForm.Active_Dealer_Ratio}
                  min="0"
                  max="1"
                  step="0.01"
                  unit=""
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="최근 거래 건수"
                  name="Recent_Trade_Count"
                  value={companyForm.Recent_Trade_Count}
                  min="0"
                  max="500"
                  unit="회"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="이전 거래 건수"
                  name="Previous_Trade_Count"
                  value={companyForm.Previous_Trade_Count}
                  min="0"
                  max="1000"
                  unit="회"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="평균 사이트 이용률"
                  name="Site_Usage_Rate_Avg"
                  value={companyForm.Site_Usage_Rate_Avg}
                  min="0"
                  max="1"
                  step="0.01"
                  unit=""
                  onChange={handleFormChange}
                />
              </div>
            ) : (
              <div>
                <RangeInput
                  label="마지막 활동 경과일"
                  name="Last_Activity_Days"
                  value={dealerForm.Last_Activity_Days}
                  min="0"
                  max="180"
                  unit="일"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="최근 60일 거래 건수"
                  name="Recent_60d_Trade_Count"
                  value={dealerForm.Recent_60d_Trade_Count}
                  min="0"
                  max="500"
                  unit="회"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="이전 거래 건수"
                  name="Previous_Trade_Count"
                  value={dealerForm.Previous_Trade_Count}
                  min="0"
                  max="1000"
                  unit="회"
                  onChange={handleFormChange}
                />
                <RangeInput
                  label="사이트 이용률"
                  name="Site_Usage_Rate"
                  value={dealerForm.Site_Usage_Rate}
                  min="0"
                  max="1"
                  step="0.01"
                  unit=""
                  onChange={handleFormChange}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={predictLoading}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "0.75rem",
                boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
              }}
            >
              {predictLoading ? "AI 분석 모델 가동 중..." : `🔮 ${isCompany ? "회사" : "딜러"} 이탈률 예측`}
            </button>
          </form>

          {/* 에러 발생 메시지 */}
          {predictError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", padding: "0.75rem", fontSize: "0.85rem", marginTop: "1rem", whiteSpace: "pre-line" }}>
              ⚠️ {predictError}
            </div>
          )}

          {/* 예측 결과 렌더링 카드 */}
          {predictResult && (
            <div style={{ marginTop: "1.25rem", padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
              <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", color: "#334155" }}>분석 결과 보고</h4>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>예측 상태:</span>
                <strong style={{ fontSize: "0.9rem", color: predictResult.predicted_status === "Inactive" ? "#f43f5e" : "#10b981" }}>
                  {predictResult.predicted_status === "Inactive" ? "이탈 위험군 (Inactive)" : "활동 유지군 (Active)"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>예측 이탈률:</span>
                <strong style={{ fontSize: "1.2rem", color: getRiskDetails(predictResult.risk_grade).color }}>
                  {predictResult.churn_probability_percent}%
                </strong>
              </div>

              {/* 등급 요약 배지 */}
              {(() => {
                const details = getRiskDetails(predictResult.risk_grade);
                return (
                  <div style={{ background: details.bg, color: details.color, padding: "0.5rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", textAlign: "center", border: `1px solid ${details.color}20` }}>
                    ● {details.text} ({predictResult.risk_grade} Grade)
                  </div>
                );
              })()}
            </div>
          )}
        </aside>

      </div>
    </AdminLayout>
  );
}

export default AdminChurnManagePage;