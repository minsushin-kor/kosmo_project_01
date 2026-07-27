import { useEffect, useState, useMemo } from "react";
import RecomendTest from "./RecomendTest";
import BuyerRecomendTest from "./BuyerRecomendTest";

function RiskReasonList({ reason }) {
  const reasons = Array.isArray(reason)
    ? reason.filter(Boolean)
    : String(reason || "모델 분석 사유가 없습니다.")
        .split(/,\s*/)
        .filter(Boolean);

  return (
    <ul className="risk-reason-list">
      {reasons.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function mapRiskGrade(riskGrade) {
  if (riskGrade === "Critical" || riskGrade === "High") return "높음";
  if (riskGrade === "Medium") return "보통";
  return "낮음";
}

function formatProbability(value) {
  const probability = Number(value);
  return Number.isFinite(probability) ? `${probability.toFixed(2)}%` : "-";
}

function mapChurnSnapshot(snapshot) {
  const dealers = Array.isArray(snapshot?.dealers)
    ? snapshot.dealers.map((item) => ({
        id: item.dealer_id,
        name: `딜러 #${item.dealer_id}`,
        recentActivity: `${item.Last_Activity_Days}일 전`,
        churnRate: formatProbability(item.churn_probability_percent),
        churnRateRaw: Number(item.churn_probability_percent) || 0,
        risk: mapRiskGrade(item.risk_grade),
        action: item.action,
        reason: item.risk_reasons,
      }))
    : [];

  const companies = Array.isArray(snapshot?.companies)
    ? snapshot.companies.map((item) => ({
        id: item.company_id,
        name: `상사 #${item.company_id}`,
        recentActivity:
          Number(item.Recent_Trade_Count) > 0
            ? `최근 60일 거래 ${item.Recent_Trade_Count}건`
            : "최근 60일 거래 없음",
        churnRate: formatProbability(item.churn_probability_percent),
        churnRateRaw: Number(item.churn_probability_percent) || 0,
        risk: mapRiskGrade(item.risk_grade),
        action: item.action,
        reason: item.risk_reasons,
      }))
    : [];

  return { dealers, companies };
}

async function fetchLatestChurnSnapshot(serverUrl) {
  const response = await fetch(
    `${serverUrl}/api/ai/predict-churn/latest`,
    { method: "GET" },
  );
  const result = await response.json().catch(() => null);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(result?.detail || "최근 이탈률 결과를 불러오지 못했습니다.");
  }

  return result;
}

function TestPage() {
  const [companyRawData, setCompanyRawData] = useState([]);
  const [dealerRawData, setDealerRawData] = useState([]);
  const [adminEmail, setAdminEmail] = useState("admin@admin.co.kr");
  const [adminPassword, setAdminPassword] = useState("");
  const [springJwt, setSpringJwt] = useState(
    () => sessionStorage.getItem("test_spring_jwt") || "",
  );
  const [springAuthStatus, setSpringAuthStatus] = useState("");
  const [isSpringAuthLoading, setIsSpringAuthLoading] = useState(false);
  const [isChurnLoading, setIsChurnLoading] = useState(false);
  const [churnStatus, setChurnStatus] = useState("idle");
  const [churnMessage, setChurnMessage] = useState(
    "Spring DB 배치를 실행하거나 최근 계산 결과를 불러오세요.",
  );
  const [lastCalculatedAt, setLastCalculatedAt] = useState("");
  
  // 서버 상태 및 설정
  const [serverStatus, setServerStatus] = useState("checking");
  const defaultServerUrl = "http://127.0.0.1:8000";
  const activeServerUrl =
    import.meta.env.VITE_FASTAPI_BASE_URL?.replace(/\/$/, "") ||
    defaultServerUrl;
  const springServerUrl =
    import.meta.env.VITE_SPRING_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8080";
  const [issuedCoupons, setIssuedCoupons] = useState(new Set()); // 쿠폰 발송 기록 ("type-id")

  // 더보기 데이터셋 로드 여부
  const [isCompanyDummyLoaded, setIsCompanyDummyLoaded] = useState(false);
  const [isDealerDummyLoaded, setIsDealerDummyLoaded] = useState(false);

  const loginToLocalSpring = async (event) => {
    event.preventDefault();
    setIsSpringAuthLoading(true);
    setSpringAuthStatus("");

    try {
      const response = await fetch(`${springServerUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminEmail.trim(),
          password: adminPassword,
          roleType: "ADMIN",
        }),
      });
      const result = await response.json();
      const token = result?.data?.token;

      if (!response.ok || !result.success || !token) {
        throw new Error(
          result?.error?.message || "로컬 Spring 관리자 인증에 실패했습니다.",
        );
      }

      sessionStorage.setItem("test_spring_jwt", token);
      setSpringJwt(token);
      setAdminPassword("");
      setSpringAuthStatus(`${result.data.name || "관리자"} 인증 완료`);
    } catch (error) {
      sessionStorage.removeItem("test_spring_jwt");
      setSpringJwt("");
      setSpringAuthStatus(error.message);
    } finally {
      setIsSpringAuthLoading(false);
    }
  };

  const applyChurnSnapshot = (snapshot) => {
    const { dealers, companies } = mapChurnSnapshot(snapshot);
    setDealerRawData(dealers);
    setCompanyRawData(companies);
    setIsDealerDummyLoaded(false);
    setIsCompanyDummyLoaded(false);

    const calculatedAt = snapshot?.calculated_at
      ? new Date(snapshot.calculated_at).toLocaleString("ko-KR")
      : "계산 시각 없음";
    setLastCalculatedAt(calculatedAt);
    setChurnStatus("success");
    setChurnMessage(
      `Spring DB 기준 회사 ${companies.length}건, 딜러 ${dealers.length}건의 이탈률을 불러왔습니다.`,
    );
  };

  const loadLatestChurnResults = async () => {
    setIsChurnLoading(true);
    setChurnStatus("loading");
    setChurnMessage("최근 이탈률 계산 결과를 불러오는 중입니다.");

    try {
      const snapshot = await fetchLatestChurnSnapshot(activeServerUrl);
      if (!snapshot) {
        setDealerRawData([]);
        setCompanyRawData([]);
        setLastCalculatedAt("");
        setChurnStatus("idle");
        setChurnMessage(
          "FastAPI가 아직 Spring DB 배치를 받은 적이 없습니다. 이탈률 계산을 실행해 주세요.",
        );
        return;
      }
      applyChurnSnapshot(snapshot);
    } catch (error) {
      setChurnStatus("error");
      setChurnMessage(error.message);
    } finally {
      setIsChurnLoading(false);
    }
  };

  const runChurnCalculation = async () => {
    if (!springJwt) {
      setChurnStatus("error");
      setChurnMessage("먼저 Spring 관리자 인증을 완료해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      "Spring 이탈 배치를 실행하면 DB의 risk_score와 등급이 갱신되고 쿠폰·골든 배지 처리도 함께 실행될 수 있습니다. 테스트 DB에서 계속하시겠습니까?",
    );
    if (!confirmed) return;

    setIsChurnLoading(true);
    setChurnStatus("loading");
    setChurnMessage("Spring DB 데이터를 집계하고 이탈률을 계산하는 중입니다.");

    try {
      const response = await fetch(
        `${springServerUrl}/api/admin/ai/churn-batch`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${springJwt}` },
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("test_spring_jwt");
          setSpringJwt("");
        }
        throw new Error(
          result?.error?.message ||
            `Spring 이탈률 배치 실행에 실패했습니다. (${response.status})`,
        );
      }

      const snapshot = await fetchLatestChurnSnapshot(activeServerUrl);
      if (!snapshot) {
        throw new Error(
          "Spring 배치는 완료됐지만 FastAPI에서 최신 계산 결과를 찾지 못했습니다.",
        );
      }
      applyChurnSnapshot(snapshot);
    } catch (error) {
      setChurnStatus("error");
      setChurnMessage(error.message);
    } finally {
      setIsChurnLoading(false);
    }
  };

  useEffect(() => {
    const checkConnectionAndFetch = async () => {
      setServerStatus("checking");

      try {
        const ping = await fetch(`${activeServerUrl}/`, { method: "GET" });
        if (!ping.ok) throw new Error("서버 연동 상태 실패");
        const health = await ping.json();
        if (
          health.individual_model_loaded === false ||
          health.company_model_loaded === false
        ) {
          throw new Error("개인 또는 회사 이탈 예측 모델이 로드되지 않았습니다.");
        }

        const snapshot = await fetchLatestChurnSnapshot(activeServerUrl);
        if (snapshot) {
          const { dealers, companies } = mapChurnSnapshot(snapshot);
          setDealerRawData(dealers);
          setCompanyRawData(companies);
          setLastCalculatedAt(
            snapshot.calculated_at
              ? new Date(snapshot.calculated_at).toLocaleString("ko-KR")
              : "계산 시각 없음",
          );
          setChurnStatus("success");
          setChurnMessage(
            `Spring DB 기준 회사 ${companies.length}건, 딜러 ${dealers.length}건의 최근 결과입니다.`,
          );
        } else {
          setChurnStatus("idle");
          setChurnMessage(
            "FastAPI 연결은 정상입니다. 아직 수신한 Spring DB 배치가 없습니다.",
          );
        }
        setServerStatus("online");
      } catch (e) {
        console.error("FastAPI 모델 예측 결과를 불러오지 못했습니다:", e);
        setServerStatus("offline");
        setDealerRawData([]);
        setCompanyRawData([]);
        setChurnStatus("error");
        setChurnMessage(e.message);
      }
    };

    checkConnectionAndFetch();
  }, [activeServerUrl]);

  // 회사 더보기 클릭 시 펼침 상태로 전환
  const loadMoreCompanies = () => {
    setIsCompanyDummyLoaded(true);
  };

  // 딜러 더보기 클릭 시 펼침 상태로 전환
  const loadMoreDealers = () => {
    setIsDealerDummyLoaded(true);
  };

  // 쿠폰 발송 핸들러
  const handleCoupon = (type, id, name) => {
    const key = `${type}-${id}`;
    if (issuedCoupons.has(key)) return;

    const couponName = type === "company" ? "멤버십 30% 할인쿠폰" : "수수료 50% 감면쿠폰";
    const confirmSend = window.confirm(`[${name}] 대상에게 [${couponName}]을 정말로 발송하시겠습니까?`);
    if (confirmSend) {
      setIssuedCoupons((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      alert(`쿠폰이 성공적으로 지급되었습니다.\n대상: ${name}\n쿠폰종류: ${couponName}`);
    }
  };

  // 고위험군 데이터 정렬 및 더보기 연동 슬라이스 처리
  const displayedCompanies = useMemo(() => {
    const sorted = [...companyRawData].sort((a, b) => b.churnRateRaw - a.churnRateRaw);
    // 더보기가 안눌렸을 때는 고위험군 5개만 노출, 클릭 시 병합된 리스트 전체를 하단에 이어서 출력
    return isCompanyDummyLoaded ? sorted : sorted.slice(0, 5);
  }, [companyRawData, isCompanyDummyLoaded]);

  const displayedDealers = useMemo(() => {
    const sorted = [...dealerRawData].sort((a, b) => b.churnRateRaw - a.churnRateRaw);
    // 더보기가 안눌렸을 때는 고위험군 5개만 노출, 클릭 시 병합된 리스트 전체를 하단에 이어서 출력
    return isDealerDummyLoaded ? sorted : sorted.slice(0, 5);
  }, [dealerRawData, isDealerDummyLoaded]);

  return (
    <div className="test-dashboard-container">
      <style>{`
        .test-dashboard-container {
          padding: 2.5rem;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #0f172a;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          background: #ffffff;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .admin-header-title h2 {
          font-size: 1.6rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.025em;
        }
        .admin-header-title p {
          color: #64748b;
          margin: 0.5rem 0 0 0;
          font-size: 0.95rem;
        }
        .admin-header-actions {
          display: flex;
          gap: 10px;
        }
        .local-spring-auth {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.25rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .local-spring-auth h3 {
          margin: 0 0 0.35rem;
          color: #1e293b;
          font-size: 1rem;
        }
        .local-spring-auth p {
          margin: 0 0 0.9rem;
          color: #64748b;
          font-size: 0.82rem;
        }
        .local-spring-auth form {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .local-spring-auth input {
          min-width: 210px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.65rem 0.8rem;
        }
        .local-spring-auth-status {
          margin-top: 0.75rem;
          color: ${springJwt ? "#047857" : "#b45309"};
          font-weight: 700;
          font-size: 0.82rem;
        }
        .churn-calculation-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .churn-calculation-warning {
          margin: 0.75rem 0 0;
          color: #b45309;
          font-size: 0.78rem;
        }
        .churn-calculation-status {
          margin-top: 0.75rem;
          padding: 0.7rem 0.85rem;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .churn-calculation-status.success {
          background: #dcfce7;
          color: #166534;
        }
        .churn-calculation-status.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .churn-calculation-status.loading {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .admin-outline-btn {
          border: 1px solid #cbd5e0;
          background: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 600;
          color: #4a5568;
          transition: background 0.2s;
        }
        .admin-outline-btn:hover {
          background: #f7fafc;
        }
        .admin-primary-btn {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .admin-primary-btn:hover {
          background-color: #2b6cb0;
        }
        .tables-vertical-stack {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .panel-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          display: flex;
          flex-direction: column;
        }
        .panel-title-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .panel-title-left h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .panel-title-left p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }
        .server-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .server-badge.online {
          background: #dcfce7;
          color: #166534;
        }
        .server-badge.offline {
          background: #fee2e2;
          color: #991b1b;
        }
        .server-badge.checking {
          background: #f1f5f9;
          color: #475569;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .admin-table th {
          background: #f8fafc;
          padding: 0.75rem 1rem;
          font-weight: 600;
          color: #475569;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
        }
        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }
        .admin-table .reason-column {
          width: 36%;
          min-width: 260px;
        }
        .admin-table td.reason-column {
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: keep-all;
          line-height: 1.55;
          vertical-align: top;
          font-size: 0.8rem;
          color: #64748b;
        }
        .risk-reason-list {
          margin: 0;
          padding-left: 1.15rem;
        }
        .risk-reason-list li {
          margin: 0 0 0.4rem;
        }
        .risk-reason-list li:last-child {
          margin-bottom: 0;
        }
        .admin-risk {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .admin-risk.높음 {
          background: #fee2e2;
          color: #991b1b;
        }
        .admin-risk.보통 {
          background: #fef3c7;
          color: #92400e;
        }
        .admin-risk.낮음 {
          background: #dcfce7;
          color: #166534;
        }
        .action-btn {
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.primary {
          background: #2563eb;
          color: #ffffff;
          border: none;
        }
        .action-btn.primary:hover {
          background: #1d4ed8;
        }
        .action-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }
        .load-more-btn {
          background: #4f46e5;
          color: #ffffff;
          border: none;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
        }
        .load-more-btn:hover {
          background: #4338ca;
        }
      `}</style>

      {/* 1. 최상단 헤더 (원래 명세로 복구) */}
      <header className="admin-header">
        <div className="admin-header-title">
          <h2>테스트테스트테스트테스트테스트테스트테스트테스트테스트테스트</h2>
          <p>테스트테스트테스트 이 페이지에서만 수정하세요 테스트테스트테스트.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-outline-btn">
            그냥버튼
          </button>
          <button type="button" className="admin-primary-btn">
            파란버튼
          </button>
        </div>
      </header>

      <section className="local-spring-auth">
        <h3>로컬 Spring DB 연동 인증</h3>
        <p>
          이 인증은 Spring Boot가 DB의 회사·딜러 활동값을 집계해 FastAPI에
          전달할 때 사용합니다. 비밀번호는 저장하지 않습니다.
        </p>
        <form onSubmit={loginToLocalSpring}>
          <input
            type="email"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            aria-label="관리자 이메일"
            placeholder="관리자 이메일"
            required
          />
          <input
            type="password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            aria-label="관리자 비밀번호"
            placeholder="관리자 비밀번호"
            required
          />
          <button
            type="submit"
            className="admin-primary-btn"
            disabled={isSpringAuthLoading}
          >
            {isSpringAuthLoading ? "인증 중" : "로컬 Spring 인증"}
          </button>
        </form>
        <div className="local-spring-auth-status" role="status">
          {springAuthStatus ||
            (springJwt
              ? "현재 브라우저 세션에 Spring JWT가 있습니다."
              : "DB 이탈률 계산 전에 Spring 관리자 인증이 필요합니다.")}
        </div>
        <div className="churn-calculation-actions">
          <button
            type="button"
            className="admin-primary-btn"
            onClick={runChurnCalculation}
            disabled={
              !springJwt || isChurnLoading || serverStatus !== "online"
            }
          >
            {isChurnLoading ? "계산 처리 중" : "Spring DB 이탈률 계산"}
          </button>
          <button
            type="button"
            className="admin-outline-btn"
            onClick={loadLatestChurnResults}
            disabled={isChurnLoading || serverStatus !== "online"}
          >
            최근 계산 결과 불러오기
          </button>
        </div>
        <p className="churn-calculation-warning">
          계산 버튼은 Spring의 기존 관리자 배치를 실행하므로 DB 위험 점수와 등급,
          쿠폰·배지 상태가 함께 갱신될 수 있습니다.
        </p>
        <div
          className={`churn-calculation-status ${churnStatus}`}
          role="status"
        >
          {churnMessage}
          {lastCalculatedAt ? ` · 계산 시각 ${lastCalculatedAt}` : ""}
        </div>
      </section>

      {/* 2. 회사(상) 및 딜러(하) 세로 세로 스택 레이아웃 */}
      <div className="tables-vertical-stack">
        
        {/* [회사 이탈 위험 관리] 컴포넌트 (위에 배치) */}
        <div className="panel-card">
          <div className="panel-title-container">
            <div className="panel-title-left">
              <h2>🏢 상사(회사) 이탈 위험 관리</h2>
              <p>회사 계정 기준 전체 거래량 및 소속 딜러들의 활동 비중을 분석한 이탈 위험 결과 목록입니다.</p>
            </div>
            <div className={`server-badge ${serverStatus}`}>
              {serverStatus === "online"
                ? companyRawData.length > 0
                  ? `● DB 예측 ${companyRawData.length}건`
                  : "○ DB 이탈률 계산 대기"
                : serverStatus === "checking"
                  ? "○ AI 모델 연결 확인 중"
                  : "○ AI 모델 서버 연결 실패"}
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>회사명</th>
                <th>최근활동</th>
                <th>이탈확률</th>
                <th>위험등급</th>
                <th>관리상태</th>
                <th className="reason-column">사유</th>
              </tr>
            </thead>
            <tbody>
              {displayedCompanies.length === 0 && (
                <tr>
                  <td colSpan="6" className="reason-column">
                    {isChurnLoading
                      ? "Spring DB 회사 데이터를 계산하는 중입니다."
                      : churnMessage}
                  </td>
                </tr>
              )}
              {displayedCompanies.map((row) => {
                const couponKey = `company-${row.id}`;
                const isCouponSent = issuedCoupons.has(couponKey);
                return (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.recentActivity}</td>
                    <td style={{ color: "#ef4444", fontWeight: "700" }}>{row.churnRate}</td>
                    <td>
                      <span className={`admin-risk ${row.risk}`}>{row.risk}</span>
                    </td>
                    <td>
                      {row.risk === "높음" ? (
                        <button
                          className="action-btn primary"
                          disabled={isCouponSent}
                          onClick={() => handleCoupon("company", row.id, row.name)}
                        >
                          {isCouponSent ? "지급완료" : "쿠폰발송"}
                        </button>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>모니터링</span>
                      )}
                    </td>
                    <td className="reason-column">
                      <RiskReasonList reason={row.reason} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 더보기 버튼 (테이블 아래에 노출하여 누르면 리스트 추가 연동 확장) */}
          {!isCompanyDummyLoaded && companyRawData.length > 5 && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMoreCompanies}>
                ➕ 회사 이탈 분석 더보기 (전체 데이터 불러오기)
              </button>
            </div>
          )}
        </div>

        {/* [개인 딜러 이탈 위험 관리] 컴포넌트 (아래에 배치) */}
        <div className="panel-card">
          <div className="panel-title-container">
            <div className="panel-title-left">
              <h2>👤 개인 딜러 이탈 위험 관리</h2>
              <p>최근 접속 지연일 및 거래 성사 빈도를 분석하여 개별 이탈 가능성을 예측한 결과 목록입니다.</p>
            </div>
            <div className={`server-badge ${serverStatus}`}>
              {serverStatus === "online"
                ? dealerRawData.length > 0
                  ? `● DB 예측 ${dealerRawData.length}건`
                  : "○ DB 이탈률 계산 대기"
                : serverStatus === "checking"
                  ? "○ AI 모델 연결 확인 중"
                  : "○ AI 모델 서버 연결 실패"}
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>딜러명</th>
                <th>최근활동</th>
                <th>이탈확률</th>
                <th>위험등급</th>
                <th>관리상태</th>
                <th className="reason-column">사유</th>
              </tr>
            </thead>
            <tbody>
              {displayedDealers.length === 0 && (
                <tr>
                  <td colSpan="6" className="reason-column">
                    {isChurnLoading
                      ? "Spring DB 딜러 데이터를 계산하는 중입니다."
                      : churnMessage}
                  </td>
                </tr>
              )}
              {displayedDealers.map((row) => {
                const couponKey = `dealer-${row.id}`;
                const isCouponSent = issuedCoupons.has(couponKey);
                return (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td>{row.recentActivity}</td>
                    <td style={{ color: "#ef4444", fontWeight: "700" }}>{row.churnRate}</td>
                    <td>
                      <span className={`admin-risk ${row.risk}`}>{row.risk}</span>
                    </td>
                    <td>
                      {row.risk === "높음" ? (
                        <button
                          className="action-btn primary"
                          disabled={isCouponSent}
                          onClick={() => handleCoupon("dealer", row.id, row.name)}
                        >
                          {isCouponSent ? "지급완료" : "쿠폰발송"}
                        </button>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>모니터링</span>
                      )}
                    </td>
                    <td className="reason-column">
                      <RiskReasonList reason={row.reason} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 더보기 버튼 (테이블 아래에 노출하여 누르면 리스트 추가 연동 확장) */}
          {!isDealerDummyLoaded && dealerRawData.length > 5 && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMoreDealers}>
                ➕ 딜러 이탈 분석 더보기 (전체 데이터 불러오기)
              </button>
            </div>
          )}
        </div>

        <RecomendTest
          fastApiServerUrl={activeServerUrl}
          springServerUrl={springServerUrl}
        />
        <BuyerRecomendTest
          springServerUrl={springServerUrl}
          springJwt={springJwt}
        />

      </div>
    </div>
  );
}

export default TestPage;
