import { useEffect, useState, useMemo } from "react";
import RecomendTest from "./RecomendTest";

function RiskReasonList({ reason }) {
  const reasons = String(reason || "모델 분석 사유가 없습니다.")
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

function TestPage() {
  const [companyRawData, setCompanyRawData] = useState([]);
  const [dealerRawData, setDealerRawData] = useState([]);
  
  // 서버 상태 및 설정
  const [serverStatus, setServerStatus] = useState("checking");
  const activeServerUrl =
    import.meta.env.VITE_FASTAPI_BASE_URL?.replace(/\/$/, "") ||
    "http://3.35.233.190:8000";
  const [issuedCoupons, setIssuedCoupons] = useState(new Set()); // 쿠폰 발송 기록 ("type-id")

  // 더보기 데이터셋 로드 여부
  const [isCompanyDummyLoaded, setIsCompanyDummyLoaded] = useState(false);
  const [isDealerDummyLoaded, setIsDealerDummyLoaded] = useState(false);

  useEffect(() => {
    const checkConnectionAndFetch = async () => {
      setServerStatus("checking");

      try {
        const ping = await fetch(`${activeServerUrl}/`, { method: "GET" });
        if (!ping.ok) throw new Error("서버 연동 상태 실패");

        const compRes = await fetch(`${activeServerUrl}/api/ai/churn/companies`);
        const dealerRes = await fetch(`${activeServerUrl}/api/ai/churn/dealers`);
        
        if (!compRes.ok || !dealerRes.ok) {
          throw new Error("데이터셋 연동 API 실패");
        }

        const compData = await compRes.json();
        const dealerData = await dealerRes.json();

        setCompanyRawData(compData);
        setDealerRawData(dealerData);
        setServerStatus("online");
      } catch (e) {
        console.error("FastAPI 모델 예측 결과를 불러오지 못했습니다:", e);
        setServerStatus("offline");
        setDealerRawData([]);
        setCompanyRawData([]);
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
                ? "● AI 모델 예측 완료"
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
          {!isCompanyDummyLoaded && (
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
                ? "● AI 모델 예측 완료"
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
          {!isDealerDummyLoaded && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMoreDealers}>
                ➕ 딜러 이탈 분석 더보기 (전체 데이터 불러오기)
              </button>
            </div>
          )}
        </div>

        <RecomendTest activeServerUrl={activeServerUrl} />

      </div>
    </div>
  );
}

export default TestPage;
