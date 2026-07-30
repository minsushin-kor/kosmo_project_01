import {
  useCallback,
  useEffect,
  useState,
} from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  getCompanyChurnUsers,
  getDealerChurnUsers,
  issueChurnRiskCoupons,
  runChurnBatch,
} from "../../api/adminChurnApi";
import { issueRiskCouponToDealer } from "../../api/couponApi";
import "../../css/admin/adminDashboardPage.css";

function renderRiskReasons(churnUser) {
  const reasons = Array.isArray(
    churnUser.reason
  )
    ? churnUser.reason
    : [];

  if (reasons.length === 0) {
    return (
      <span className="admin-churn-reason-empty">
        분석 사유 없음
      </span>
    );
  }

  return (
    <ul className="admin-churn-reason-list">
      {reasons.map((reason, index) => (
        <li key={`${churnUser.id}-${index}`}>
          {reason}
        </li>
      ))}
    </ul>
  );
}

const companyChurnColumns = [
  {
    key: "memberType",
    label: "회원유형",
  },
  {
    key: "name",
    label: "회사명",
  },
  {
    key: "calculatedAt",
    label: "예측 시각 (KST)",
  },
  {
    key: "churnRate",
    label: "이탈확률",
  },
  {
    key: "risk",
    label: "위험등급",
    render: (company) => (
      <span
        className={`admin-risk ${company.risk}`}
      >
        {company.risk}
      </span>
    ),
  },
  {
    key: "reason",
    label: "위험 감지 사유",
    render: renderRiskReasons,
  },
];

const dealerChurnColumns = [
  {
    key: "memberType",
    label: "회원유형",
  },
  {
    key: "name",
    label: "딜러명",
  },
  {
    key: "calculatedAt",
    label: "예측 시각 (KST)",
  },
  {
    key: "churnRate",
    label: "이탈확률",
  },
  {
    key: "risk",
    label: "위험등급",
    render: (dealer) => (
      <span
        className={`admin-risk ${dealer.risk}`}
      >
        {dealer.risk}
      </span>
    ),
  },
  {
    key: "couponStatus",
    label: "쿠폰 상태",
    render: (dealer) => (
      <strong
        style={{
          color: dealer.couponEligible
            ? "#2563eb"
            : "#475569",
          whiteSpace: "nowrap",
        }}
      >
        {dealer.couponStatus}
      </strong>
    ),
  },
  {
    key: "action",
    label: "추천 조치",
    render: (dealer) => (
      <button
        type="button"
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#ffffff",
          backgroundColor: "#2563eb",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
        onClick={async (e) => {
          e.stopPropagation();
          if (!dealer?.id) return;
          if (!window.confirm(`[${dealer.name || "딜러"}] 딜러에게 수수료 50% 감면 쿠폰을 1건 직접 발급하시겠습니까?`)) {
            return;
          }
          try {
            await issueRiskCouponToDealer(dealer.id);
            alert(`🎉 [${dealer.name || "딜러"}] 딜러에게 쿠폰 발급 및 실시간 알림 전송이 완료되었습니다!`);
            window.location.reload();
          } catch (err) {
            alert(err?.response?.data?.message || err?.message || "30일 내 이미 쿠폰이 발급된 딜러이거나 쿠폰 발급에 실패했습니다.");
          }
        }}
      >
        🎟️ 쿠폰 1건 발급
      </button>
    ),
  },
  {
    key: "reason",
    label: "위험 감지 사유",
    render: renderRiskReasons,
  },
];

async function requestChurnUsers(
  churnType
) {
  if (churnType === "company") {
    return getCompanyChurnUsers();
  }

  return getDealerChurnUsers();
}

function AdminChurnManagePage({
  churnType,
}) {
  const [companyChurnUsers, setCompanyChurnUsers] =
    useState([]);
  const [dealerChurnUsers, setDealerChurnUsers] =
    useState([]);
  const [loadedChurnType, setLoadedChurnType] =
    useState(null);
  const [refreshing, setRefreshing] =
    useState(false);
  const [batchRunning, setBatchRunning] =
    useState(false);
  const [couponRunning, setCouponRunning] =
    useState(false);
  const [loadError, setLoadError] =
    useState("");
  const [batchMessage, setBatchMessage] =
    useState("");
  const [couponMessage, setCouponMessage] =
    useState("");

  const isCompany =
    churnType === "company";
  const loading =
    loadedChurnType !== churnType ||
    refreshing;

  const applyChurnUsers = useCallback(
    (
      requestedType,
      churnUsers
    ) => {
      if (requestedType === "company") {
        setCompanyChurnUsers(churnUsers);
      } else {
        setDealerChurnUsers(churnUsers);
      }

      setLoadedChurnType(requestedType);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const churnUsers =
          await requestChurnUsers(
            churnType
          );

        if (cancelled) {
          return;
        }

        applyChurnUsers(
          churnType,
          churnUsers
        );
        setLoadError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "이탈 위험 데이터 로드 실패:",
          error
        );

        applyChurnUsers(
          churnType,
          []
        );
        setLoadError(
          error instanceof Error
            ? error.message
            : "이탈 위험 데이터를 불러오지 못했습니다."
        );
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [churnType, applyChurnUsers]);

  const handleRefresh = async () => {
    if (
      refreshing ||
      batchRunning ||
      couponRunning
    ) {
      return;
    }

    setRefreshing(true);
    setLoadError("");
    setBatchMessage("");
    setCouponMessage("");

    try {
      const churnUsers =
        await requestChurnUsers(
          churnType
        );

      applyChurnUsers(
        churnType,
        churnUsers
      );
    } catch (error) {
      console.error(
        "이탈 위험 데이터 새로고침 실패:",
        error
      );
      setLoadError(
        error instanceof Error
          ? error.message
          : "이탈 위험 데이터를 새로고침하지 못했습니다."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunBatch = async () => {
    if (
      batchRunning ||
      refreshing ||
      couponRunning
    ) {
      return;
    }

    const confirmed = window.confirm(
      "현재 DB의 거래·입찰 정보를 기준으로 회사와 딜러의 이탈률과 위험 등급을 다시 계산합니다. 쿠폰은 자동 지급되지 않습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    setBatchRunning(true);
    setLoadError("");
    setCouponMessage("");
    setBatchMessage(
      "EC2 FastAPI 모델로 이탈률을 계산하는 중입니다."
    );

    try {
      await runChurnBatch();

      const churnUsers =
        await requestChurnUsers(
          churnType
        );

      applyChurnUsers(
        churnType,
        churnUsers
      );
      setBatchMessage(
        "최신 이탈률 계산과 DB 반영이 완료되었습니다."
      );
    } catch (error) {
      console.error(
        "이탈률 배치 실행 실패:",
        error
      );
      setBatchMessage("");
      setLoadError(
        error instanceof Error
          ? error.message
          : "이탈률 계산을 실행하지 못했습니다."
      );
    } finally {
      setBatchRunning(false);
    }
  };

  const handleIssueCoupons = async () => {
    if (
      isCompany ||
      couponRunning ||
      refreshing ||
      batchRunning
    ) {
      return;
    }

    const confirmed = window.confirm(
      "현재 저장된 이탈 확률이 70% 이상인 활성 딜러에게 쿠폰을 일괄 지급합니다. 쿠폰을 이미 받았거나 사용한 딜러에게는 추가 지급되지 않습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    setCouponRunning(true);
    setLoadError("");
    setBatchMessage("");
    setCouponMessage(
      "이탈 위험 딜러의 쿠폰 지급 대상을 확인하는 중입니다."
    );

    try {
      const result =
        await issueChurnRiskCoupons();

      const churnUsers =
        await getDealerChurnUsers();

      applyChurnUsers(
        "dealer",
        churnUsers
      );

      setCouponMessage(
        `쿠폰 ${result.issuedCount ?? 0}건 지급 완료 · ` +
          `보유 중 제외 ${result.skippedUnusedCount ?? 0}건 · ` +
          `사용 완료 제외 ${result.skippedUsedCount ?? 0}건 · ` +
          `과거 발급 이력 제외 ${result.skippedExpiredOrOtherCount ?? 0}건 · ` +
          `비활성 제외 ${result.skippedInactiveCount ?? 0}건`
      );
    } catch (error) {
      console.error(
        "이탈 위험 쿠폰 일괄 지급 실패:",
        error
      );
      setCouponMessage("");
      setLoadError(
        error instanceof Error
          ? error.message
          : "쿠폰 일괄 지급을 실행하지 못했습니다."
      );
    } finally {
      setCouponRunning(false);
    }
  };

  const churnUsers = isCompany
    ? companyChurnUsers
    : dealerChurnUsers;
  const columns = isCompany
    ? companyChurnColumns
    : dealerChurnColumns;

  return (
    <AdminLayout
      title={
        isCompany
          ? "회사 이탈 위험 관리"
          : "딜러 이탈 위험 관리"
      }
      description={
        isCompany
          ? "회사 활동 데이터를 Random Forest 모델로 분석한 이탈 확률과 위험 등급입니다."
          : "딜러 활동 데이터를 Random Forest 모델로 분석한 이탈 확률과 위험 등급입니다."
      }
      actions={
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="admin-outline-btn"
            onClick={handleRefresh}
            disabled={
              refreshing ||
              batchRunning ||
              couponRunning
            }
          >
            {refreshing
              ? "새로고침 중..."
              : "🔄 목록 새로고침"}
          </button>

          <button
            type="button"
            className="admin-primary-btn"
            onClick={handleRunBatch}
            disabled={
              batchRunning ||
              refreshing ||
              couponRunning
            }
          >
            {batchRunning
              ? "이탈률 계산 중..."
              : "AI 이탈률 다시 계산"}
          </button>

          {!isCompany && (
            <button
              type="button"
              className="admin-primary-btn"
              onClick={handleIssueCoupons}
              disabled={
                couponRunning ||
                refreshing ||
                batchRunning
              }
              style={{
                background: "#0f766e",
              }}
            >
              {couponRunning
                ? "쿠폰 지급 중..."
                : "70% 이상 쿠폰 일괄 지급"}
            </button>
          )}
        </div>
      }
    >
      {loadError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1rem",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.88rem",
          }}
        >
          ⚠️ {loadError}
        </div>
      )}

      {batchMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1rem",
            border: "1px solid #93c5fd",
            borderRadius: "8px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "0.88rem",
          }}
        >
          {batchMessage}
        </div>
      )}

      {!isCompany && couponMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1rem",
            border: "1px solid #5eead4",
            borderRadius: "8px",
            background: "#f0fdfa",
            color: "#0f766e",
            fontSize: "0.88rem",
          }}
        >
          {couponMessage}
        </div>
      )}

      <section
        className="admin-churn-dashboard-grid"
        style={{
          gridTemplateColumns: "1fr",
          margin: 0,
        }}
      >
        {loading ? (
          <div
            className="admin-panel"
            style={{
              textAlign: "center",
              padding: "3rem",
            }}
          >
            <p>
              Spring DB의 최신 이탈 위험
              데이터를 불러오는 중입니다.
            </p>
          </div>
        ) : (
          <article className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>
                  {isCompany
                    ? "회사 이탈 위험 목록"
                    : "딜러 이탈 위험 목록"}
                </h3>

                <p>
                  Spring DB에 저장된 최신
                  FastAPI 모델 예측 결과입니다.
                </p>
              </div>
            </div>

            <AdminTable
              columns={columns}
              data={churnUsers}
              emptyMessage={
                isCompany
                  ? "조회된 회사 이탈 위험 데이터가 없습니다."
                  : "조회된 딜러 이탈 위험 데이터가 없습니다."
              }
            />
          </article>
        )}
      </section>
    </AdminLayout>
  );
}

export default AdminChurnManagePage;
