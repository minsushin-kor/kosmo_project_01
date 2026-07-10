import { useEffect, useState, useMemo } from "react";
import AdminTable from "../../components/admin/AdminTable";

// RandomForest 학습 및 예측 입력으로 사용하는 시연 데이터
import testDealerChurn from "./dealer_churn_prediction_dummy.json";
import testCompanyChurn from "./company_churn_prediction_dummy.json";

function toKoreanRiskGrade(riskGrade) {
  if (riskGrade === "Critical" || riskGrade === "High") return "높음";
  if (riskGrade === "Medium") return "보통";
  return "낮음";
}

function TestPage() {
  const [companyRawData, setCompanyRawData] = useState([]);
  const [dealerRawData, setDealerRawData] = useState([]);
  
  // 서버 통신 상태
  const [serverStatus, setServerStatus] = useState("checking"); // checking | online | offline
  const activeServerUrl = "http://127.0.0.1:8001";
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [issuedCoupons, setIssuedCoupons] = useState(new Set()); // 발급 완료된 쿠폰 키 ("타입-ID")

  // ============================================================
  // 📄 페이지네이션 상태값 (한 페이지에 5개 표시)
  // ============================================================
  const ITEMS_PER_PAGE = 5;
  const [companyPage, setCompanyPage] = useState(1);
  const [dealerPage, setDealerPage] = useState(1);

  // ============================================================
  // 🧠 실시간 AI 피처 시뮬레이터 (Simulator States)
  // ============================================================
  const [simMode, setSimMode] = useState("dealer"); // dealer | company
  
  // 1. 딜러 시뮬레이션 입력값
  const [dealerSimInputs, setDealerSimInputs] = useState({
    lastActivityDays: 15,
    recent60dTradeCount: 2,
    previousTradeCount: 90,
    siteUsageRate: 0.25,
    avgSellingPrice: 18000000 // 1800만원
  });

  // 2. 회사 시뮬레이션 입력값
  const [companySimInputs, setCompanySimInputs] = useState({
    dealerCount: 12,
    activeDealerRatio: 0.50,
    recentTradeCount: 6,
    previousTradeCount: 300,
    siteUsageRateAvg: 0.40,
    avgSellingPriceAvg: 22000000 // 2200만원
  });

  // 3. 시뮬레이션 결과 출력용 상태
  const [simResult, setSimResult] = useState({
    probability: 0,
    riskGrade: "낮음",
    reasons: ["슬라이더 값을 조절하고 [예측 시작!] 버튼을 눌러주세요."]
  });

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  // 모델 연결 이후 탭이 바뀌면 해당 모델로 기본 입력값을 예측한다.
  useEffect(() => {
    if (serverStatus === "online") runLiveSimulation();
  }, [simMode, serverStatus]);

  async function requestPrediction(endpoint, body) {
    const response = await fetch(`${activeServerUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`모델 API 오류 (${response.status}): ${errorBody}`);
    }

    return response.json();
  }

  async function checkConnectionAndFetch() {
    setServerStatus("checking");

    const mappedDealers = testDealerChurn.map((row) => {
      const probability = Number(row.model_churn_probability_percent);
      const risk = toKoreanRiskGrade(row.model_risk_grade);
      return {
        id: row.dealer_id,
        type: "개인딜러",
        memberType: "개인딜러",
        name: `딜러_${String(row.dealer_id - 1000).padStart(3, "0")}`,
        recentActivity: `${row.last_activity_days}일 전`,
        churnRate: `${Math.round(probability)}%`,
        churnRateRaw: probability,
        risk,
        action: risk === "높음" ? "수수료 50% 쿠폰발송" : risk === "보통" ? "전화 상담 필요" : "모니터링",
        status: "처리전",
        reason: row.model_risk_reasons?.join(", ") || "모델 분석 사유가 없습니다."
      };
    });

    const mappedCompanies = testCompanyChurn.map((row) => {
      const probability = Number(row.model_churn_probability_percent);
      const risk = toKoreanRiskGrade(row.model_risk_grade);
      return {
        id: row.company_id,
        type: "회사",
        memberType: "회사",
        name: `상사_${String(row.company_id).padStart(2, "0")}`,
        recentActivity: row.recent_60d_trade_count > 0 ? "최근 거래 있음" : "활동 이력 없음",
        churnRate: `${Math.round(probability)}%`,
        churnRateRaw: probability,
        risk,
        action: risk === "높음" ? "멤버십 30% 쿠폰발송" : risk === "보통" ? "전화 상담 필요" : "모니터링",
        status: "처리전",
        reason: row.model_risk_reasons?.join(", ") || "모델 분석 사유가 없습니다."
      };
    });

    setDealerRawData(mappedDealers);
    setCompanyRawData(mappedCompanies);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    try {
      const ping = await fetch(`${activeServerUrl}/`, { signal: controller.signal });
      if (!ping.ok) throw new Error("AI 모델 서버 상태 확인 실패");
      window.clearTimeout(timeoutId);
      setServerStatus("online");
    } catch (error) {
      window.clearTimeout(timeoutId);
      setServerStatus("offline");
      console.warn("사전 RandomForest 예측 결과를 표시하며 실시간 서버는 연결되지 않았습니다.", error);
    }
  }

  async function runLiveSimulation() {
    if (serverStatus !== "online") return;

    const isDealer = simMode === "dealer";
    const endpoint = isDealer
      ? "/api/ai/predict-churn/individual"
      : "/api/ai/predict-churn/company";
    const body = isDealer
      ? {
          Last_Activity_Days: Number(dealerSimInputs.lastActivityDays),
          Recent_60d_Trade_Count: Number(dealerSimInputs.recent60dTradeCount),
          Previous_Trade_Count: Number(dealerSimInputs.previousTradeCount),
          Site_Usage_Rate: Number(dealerSimInputs.siteUsageRate),
          Avg_Selling_Price: Number(dealerSimInputs.avgSellingPrice)
        }
      : {
          Dealer_Count: Number(companySimInputs.dealerCount),
          Active_Dealer_Ratio: Number(companySimInputs.activeDealerRatio),
          Recent_Trade_Count: Number(companySimInputs.recentTradeCount),
          Previous_Trade_Count: Number(companySimInputs.previousTradeCount),
          Site_Usage_Rate_Avg: Number(companySimInputs.siteUsageRateAvg),
          Avg_Selling_Price_Avg: Number(companySimInputs.avgSellingPriceAvg)
        };

    try {
      const prediction = await requestPrediction(endpoint, body);
      setSimResult({
        probability: prediction.churn_probability_percent,
        riskGrade: toKoreanRiskGrade(prediction.risk_grade),
        reasons: prediction.risk_reasons || ["모델 분석 사유가 없습니다."]
      });
    } catch (error) {
      setSimResult({
        probability: 0,
        riskGrade: "오류",
        reasons: ["RandomForest 모델 예측 요청에 실패했습니다."]
      });
      console.error("RandomForest 실시간 예측 실패:", error);
    }
  }

  // 고위험군 순 정렬 (내림차순)
  const sortedCompanies = useMemo(() => {
    return [...companyRawData]
      .sort((a, b) => b.churnRateRaw - a.churnRateRaw);
  }, [companyRawData]);

  const sortedDealers = useMemo(() => {
    return [...dealerRawData]
      .sort((a, b) => b.churnRateRaw - a.churnRateRaw);
  }, [dealerRawData]);

  // 페이지네이션 슬라이스
  const paginatedCompanies = useMemo(() => {
    const start = (companyPage - 1) * ITEMS_PER_PAGE;
    return sortedCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCompanies, companyPage]);

  const paginatedDealers = useMemo(() => {
    const start = (dealerPage - 1) * ITEMS_PER_PAGE;
    return sortedDealers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedDealers, dealerPage]);

  const companyTotalPages = Math.ceil(sortedCompanies.length / ITEMS_PER_PAGE) || 1;
  const dealerTotalPages = Math.ceil(sortedDealers.length / ITEMS_PER_PAGE) || 1;

  // 쿠폰 발송 핸들러
  const handleManualCoupon = (id, name, type) => {
    const couponName = type === "회사" ? "30% 멤버십 할인 쿠폰" : "50% 중고차 수수료 할인 쿠폰";
    const userConfirmed = window.confirm(
      `🎟️ [쿠폰 수동 발송 알림]\n\n${name} 님에게 [${couponName}]을 즉시 발송하시겠습니까?`
    );

    if (userConfirmed) {
      setIssuedCoupons((prev) => {
        const next = new Set(prev);
        next.add(`${type}-${id}`);
        return next;
      });
      alert(`🎉 [지급 완료]\n\n${name} 님에게 쿠폰 발송이 완료되었습니다!`);
    }
  };

  const companyColumns = [
    { key: "id", label: "상사 ID" },
    { key: "name", label: "회사명" },
    { key: "recentActivity", label: "최근활동" },
    {
      key: "churnRate",
      label: "이탈확률",
      render: (member) => <strong style={{ color: member.risk === "높음" ? "#dc3545" : "#333" }}>{member.churnRate}</strong>
    },
    {
      key: "risk",
      label: "위험등급",
      render: (member) => <span className={`admin-risk ${member.risk}`}>{member.risk}</span>
    },
    {
      key: "action",
      label: "이탈 대책 행동",
      render: (member) => {
        const key = `회사-${member.id}`;
        if (issuedCoupons.has(key)) {
          return <span style={{ color: "#28a745", fontWeight: "bold" }}>지급완료</span>;
        }
        if (member.risk === "높음") {
          return (
            <button
              type="button"
              className="admin-primary-btn"
              style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px" }}
              onClick={() => handleManualCoupon(member.id, member.name, "회사")}
            >
              쿠폰 발송
            </button>
          );
        }
        return <span>{member.action}</span>;
      }
    },
    { key: "reason", label: "위험 사유 분석" }
  ];

  const dealerColumns = [
    { key: "id", label: "딜러 ID" },
    { key: "name", label: "딜러명" },
    { key: "recentActivity", label: "최근활동" },
    {
      key: "churnRate",
      label: "이탈확률",
      render: (member) => <strong style={{ color: member.risk === "높음" ? "#dc3545" : "#333" }}>{member.churnRate}</strong>
    },
    {
      key: "risk",
      label: "위험등급",
      render: (member) => <span className={`admin-risk ${member.risk}`}>{member.risk}</span>
    },
    {
      key: "action",
      label: "이탈 대책 행동",
      render: (member) => {
        const key = `개인딜러-${member.id}`;
        if (issuedCoupons.has(key)) {
          return <span style={{ color: "#28a745", fontWeight: "bold" }}>지급완료</span>;
        }
        if (member.risk === "높음") {
          return (
            <button
              type="button"
              className="admin-primary-btn"
              style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px" }}
              onClick={() => handleManualCoupon(member.id, member.name, "개인딜러")}
            >
              쿠폰 발송
            </button>
          );
        }
        return <span>{member.action}</span>;
      }
    },
    { key: "reason", label: "위험 사유 분석" }
  ];

  return (
    <div className="admin-standalone-container">
      {/* 1. 디자인 시스템 CSS 주입 */}
      <style>{`
        .admin-standalone-container {
          padding: 30px;
          background-color: #f4f6f8;
          min-height: 100vh;
          font-family: 'Inter', 'Outfit', sans-serif;
          color: #2b3a4a;
        }
        .header-standalone {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 16px;
        }
        .header-title h1 {
          font-size: 26px;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 4px 0;
        }
        .header-title p {
          font-size: 14px;
          color: #718096;
          margin: 0;
        }
        .glass-card-full {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          background: #edf2f7;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.online { background: #2f855a; box-shadow: 0 0 8px #48bb78; }
        .status-dot.offline { background: #c53030; box-shadow: 0 0 8px #f56565; }
        .status-dot.checking { background: #ecc94b; }

        /* 시뮬레이터 */
        .simulator-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 15px;
        }
        .sim-mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .sim-tab-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f7fafc;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sim-tab-btn.active {
          background: #3182ce;
          color: #ffffff;
          border-color: #3182ce;
        }
        .slider-control-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .slider-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .slider-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: bold;
        }
        .input-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #cbd5e0;
          outline: none;
          -webkit-appearance: none;
        }
        .input-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3182ce;
          cursor: pointer;
        }
        .result-panel {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 250px;
        }
        .gauge-container {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #edf2f7;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
        }
        .gauge-inner-value {
          font-size: 24px;
          font-weight: 800;
        }
        .risk-badge-large {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .risk-badge-large.높음 { background: #fed7d7; color: #9b2c2c; }
        .risk-badge-large.보통 { background: #feebc8; color: #9c4221; }
        .risk-badge-large.낮음 { background: #c6f6d5; color: #22543d; }
        .reasons-list {
          font-size: 13px;
          color: #4a5568;
          text-align: center;
          line-height: 1.5;
          margin: 0;
          padding: 0 10px;
          word-break: keep-all;
        }

        .guide-box {
          background: #2d3748;
          color: #e2e8f0;
          font-family: monospace;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.6;
          margin-top: 12px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        .admin-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .admin-panel-header {
          margin-bottom: 20px;
        }
        .admin-panel-header h3 {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 6px 0;
          color: #2d3748;
        }
        .admin-panel-header p {
          font-size: 13px;
          color: #718096;
          margin: 0;
        }
        .table-scroll-container {
          border: 1px solid #edf2f7;
          border-radius: 8px;
          background: #fff;
        }

        /* 공통 어드민 스타일링 주입 */
        .admin-risk {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .admin-risk.높음 { background: #fed7d7; color: #9b2c2c; }
        .admin-risk.보통 { background: #feebc8; color: #9c4221; }
        .admin-risk.낮음 { background: #c6f6d5; color: #2f855a; }
        .admin-primary-btn {
          background-color: #3182ce;
          color: white;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          outline: none;
        }
        .admin-primary-btn:hover {
          background-color: #2b6cb0;
        }
        .admin-outline-btn {
          border: 1px solid #cbd5e0;
          background: white;
          cursor: pointer;
          outline: none;
        }
        .admin-outline-btn:hover {
          background: #f7fafc;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #edf2f7;
        }
        .admin-table th {
          background-color: #f7fafc;
          font-weight: bold;
          color: #4a5568;
        }

        /* 페이지네이션 스타일 */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 10px;
        }
        .pagination-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e0;
          background: #ffffff;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #a0aec0;
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-indicator {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }
      `}</style>

      {/* 2. 상단 헤더 영역 */}
      <header className="header-standalone">
        <div className="header-title">
          <h1>차세대 AI 고객 이탈 실시간 시뮬레이션 대시보드</h1>
          <p>전체 탭을 제거하고 핵심 이탈율 관리 지표와 실시간 변수 시뮬레이터에 포커싱된 관리자 페이지입니다.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="status-badge">
            <span className={`status-dot ${serverStatus}`}></span>
            <span>
              {serverStatus === "online" && "RandomForest 예측 결과 · 실시간 서버 연결"}
              {serverStatus === "offline" && "RandomForest 사전 예측 결과 · 실시간 서버 미연결"}
              {serverStatus === "checking" && "RandomForest 예측 결과 불러오는 중..."}
            </span>
          </div>
          <button
            type="button"
            className="admin-outline-btn"
            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}
            onClick={() => setIsGuideOpen(!isGuideOpen)}
          >
            {isGuideOpen ? "연동 가이드 닫기" : "팀원 연동 안내"}
          </button>
        </div>
      </header>

      {/* 팀원 연동 안내 카드 */}
      {isGuideOpen && (
        <div className="glass-card-full" style={{ borderLeft: "4px solid #3182ce" }}>
          <h4>💡 팀원들을 위한 FastAPI 인공지능 서버 로컬 구동 방법</h4>
          <p style={{ fontSize: "13px", color: "#4a5568", margin: "4px 0 12px 0" }}>
            본인의 로컬 PC에서 실시간 인공지능 분석 연동을 켜고 싶다면 아래 터미널 명령어를 순서대로 실행하세요.
          </p>
          <div className="guide-box">
            # 1. AI 모듈 경로로 이동<br />
            cd Model<br /><br />
            # 2. 필수 라이브러리 설치 (최초 1회)<br />
            pip install fastapi uvicorn scikit-learn pandas joblib<br /><br />
            # 3. 로컬 Uvicorn 서버 가동 (CORS 지원 자동 개방)<br />
            uvicorn main:app --port 8001 --reload
          </div>
        </div>
      )}

      {/* 3. 🧠 실시간 AI 피처 변수 시뮬레이터 */}
      <section className="glass-card-full">
        <div className="sim-mode-selector">
          <button
            className={`sim-tab-btn ${simMode === "dealer" ? "active" : ""}`}
            onClick={() => setSimMode("dealer")}
          >
            👤 딜러 개별 이탈 시뮬레이터
          </button>
          <button
            className={`sim-tab-btn ${simMode === "company" ? "active" : ""}`}
            onClick={() => setSimMode("company")}
          >
            🏢 상사 회사 이탈 시뮬레이터
          </button>
        </div>

        <div className="simulator-grid">
          {/* 가변 슬라이더 조절 패널 */}
          <div className="slider-control-group">
            {simMode === "dealer" ? (
              <>
                <div className="slider-field">
                  <div className="slider-info">
                    <span>⏱️ 마지막 활동 경과일 (Last_Activity_Days)</span>
                    <span>{dealerSimInputs.lastActivityDays}일 전</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="60"
                    value={dealerSimInputs.lastActivityDays}
                    onChange={(e) => setDealerSimInputs({ ...dealerSimInputs, lastActivityDays: e.target.value })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🤝 최근 60일 거래량 (Recent_60d_Trade_Count)</span>
                    <span>{dealerSimInputs.recent60dTradeCount}대</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="30"
                    value={dealerSimInputs.recent60dTradeCount}
                    onChange={(e) => setDealerSimInputs({ ...dealerSimInputs, recent60dTradeCount: e.target.value })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🗄️ 누적 실적 거래량 (Previous_Trade_Count)</span>
                    <span>{dealerSimInputs.previousTradeCount}대</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="500"
                    value={dealerSimInputs.previousTradeCount}
                    onChange={(e) => setDealerSimInputs({ ...dealerSimInputs, previousTradeCount: e.target.value })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🖱️ 사이트 매물 조회 이용률 (Site_Usage_Rate)</span>
                    <span>{Math.round(dealerSimInputs.siteUsageRate * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={dealerSimInputs.siteUsageRate}
                    onChange={(e) => setDealerSimInputs({ ...dealerSimInputs, siteUsageRate: Number(e.target.value) })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>💰 평균 판매 차량 단가 (Avg_Selling_Price)</span>
                    <span>{Math.round(dealerSimInputs.avgSellingPrice / 10000)}만원</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="1000000"
                    max="80000000"
                    step="1000000"
                    value={dealerSimInputs.avgSellingPrice}
                    onChange={(e) => setDealerSimInputs({ ...dealerSimInputs, avgSellingPrice: Number(e.target.value) })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="slider-field">
                  <div className="slider-info">
                    <span>👥 소속 딜러 수 (Dealer_Count)</span>
                    <span>{companySimInputs.dealerCount}명</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="1"
                    max="40"
                    value={companySimInputs.dealerCount}
                    onChange={(e) => setCompanySimInputs({ ...companySimInputs, dealerCount: e.target.value })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🟢 활동 딜러 비율 (Active_Dealer_Ratio)</span>
                    <span>{Math.round(companySimInputs.activeDealerRatio * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={companySimInputs.activeDealerRatio}
                    onChange={(e) => setCompanySimInputs({ ...companySimInputs, activeDealerRatio: Number(e.target.value) })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🤝 최근 60일 전체 거래량 (Recent_Trade_Count)</span>
                    <span>{companySimInputs.recentTradeCount}대</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="150"
                    value={companySimInputs.recentTradeCount}
                    onChange={(e) => setCompanySimInputs({ ...companySimInputs, recentTradeCount: e.target.value })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>🖱️ 상사 평균 사이트 이용률 (Site_Usage_Rate_Avg)</span>
                    <span>{Math.round(companySimInputs.siteUsageRateAvg * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={companySimInputs.siteUsageRateAvg}
                    onChange={(e) => setCompanySimInputs({ ...companySimInputs, siteUsageRateAvg: Number(e.target.value) })}
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-info">
                    <span>💰 소속 딜러 평균 판매 차량 단가 (Avg_Selling_Price_Avg)</span>
                    <span>{Math.round(companySimInputs.avgSellingPriceAvg / 10000)}만원</span>
                  </div>
                  <input
                    type="range"
                    className="input-slider"
                    min="1000000"
                    max="80000000"
                    step="1000000"
                    value={companySimInputs.avgSellingPriceAvg}
                    onChange={(e) => setCompanySimInputs({ ...companySimInputs, avgSellingPriceAvg: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* 예측 시작! 실행 버튼 */}
            <button
              type="button"
              className="admin-primary-btn"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "15px",
                marginTop: "20px",
                boxShadow: "0 4px 12px rgba(49, 130, 206, 0.3)",
                cursor: "pointer",
                transition: "transform 0.1s"
              }}
              onClick={runLiveSimulation}
            >
              🚀 예측 시작!
            </button>
          </div>

          {/* AI 실시간 예측 아웃풋 패널 */}
          <div className="result-panel">
            <h4 style={{ margin: "0 0 15px 0", color: "#4a5568", fontWeight: "bold" }}>🎯 실시간 AI 피처 변동 이탈 예측 결과</h4>
            <div className="gauge-container">
              <span
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: "50%",
                  border: `6px solid ${simResult.probability >= 70 ? "#e53e3e" : simResult.probability >= 40 ? "#dd6b20" : "#38a169"}`
                }}
              />
              <div className="gauge-inner-value" style={{ color: simResult.probability >= 70 ? "#e53e3e" : simResult.probability >= 40 ? "#dd6b20" : "#38a169" }}>
                {simResult.probability}%
              </div>
            </div>
            <span className={`risk-badge-large ${simResult.riskGrade}`}>
              이탈 위험 등급 : {simResult.riskGrade}
            </span>
            <p className="reasons-list">
              <strong>리스크 원인 분석:</strong><br />
              {simResult.reasons.join(" / ")}
            </p>
          </div>
        </div>
      </section>

      {/* 4. 2대 핵심 이탈 목록 대시보드 표 */}
      <section className="dashboard-grid">
        {/* 상사 이탈 목록 */}
        <article className="admin-panel" style={{ marginBottom: "20px" }}>
          <div className="admin-panel-header">
            <h3>상사 이탈 위험 분석 및 예측 관리 목록 (총 20개 사)</h3>
            <p>상사별 활동 지표를 AI 모델로 연산한 결과로, 이탈 위험이 가장 높은 회원을 상단에 배치합니다. (한 페이지에 5개씩 표출)</p>
          </div>
          <div className="table-scroll-container">
            <AdminTable
              columns={companyColumns}
              data={paginatedCompanies}
              emptyMessage="상사 이탈 위험 데이터셋 로드에 실패했습니다."
            />
          </div>
          {/* 상사 테이블 페이지네이션 컨트롤러 */}
          <div className="pagination-container">
            <button
              type="button"
              className="pagination-btn"
              disabled={companyPage === 1}
              onClick={() => setCompanyPage((p) => Math.max(1, p - 1))}
            >
              ◀ 이전
            </button>
            <span className="page-indicator">
              {companyPage} / {companyTotalPages} 페이지
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={companyPage === companyTotalPages}
              onClick={() => setCompanyPage((p) => Math.min(companyTotalPages, p + 1))}
            >
              다음 ▶
            </button>
          </div>
        </article>

        {/* 딜러 이탈 목록 */}
        <article className="admin-panel">
          <div className="admin-panel-header">
            <h3>딜러 이탈 위험 분석 및 예측 관리 목록 (총 100명)</h3>
            <p>딜러별 최근 활동 및 누적 데이터를 AI 모델로 분석한 결과로, 이탈 위험이 가장 높은 딜러를 상단에 배치합니다. (한 페이지에 5개씩 표출)</p>
          </div>
          <div className="table-scroll-container">
            <AdminTable
              columns={dealerColumns}
              data={paginatedDealers}
              emptyMessage="딜러 이탈 위험 데이터셋 로드에 실패했습니다."
            />
          </div>
          {/* 딜러 테이블 페이지네이션 컨트롤러 */}
          <div className="pagination-container">
            <button
              type="button"
              className="pagination-btn"
              disabled={dealerPage === 1}
              onClick={() => setDealerPage((p) => Math.max(1, p - 1))}
            >
              ◀ 이전
            </button>
            <span className="page-indicator">
              {dealerPage} / {dealerTotalPages} 페이지
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={dealerPage === dealerTotalPages}
              onClick={() => setDealerPage((p) => Math.min(dealerTotalPages, p + 1))}
            >
              다음 ▶
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

export default TestPage;
