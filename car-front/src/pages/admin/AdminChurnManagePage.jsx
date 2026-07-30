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
  runChurnBatch,
} from "../../api/adminChurnApi";
import "../../css/admin/adminDashboardPage.css";

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
    label: "예측 시각",
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
    key: "action",
    label: "추천 조치",
  },
  {
    key: "reason",
    label: "위험 감지 사유",
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
    label: "예측 시각",
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
    key: "action",
    label: "추천 조치",
  },
  {
    key: "reason",
    label: "위험 감지 사유",
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
  const [loadError, setLoadError] =
    useState("");
  const [batchMessage, setBatchMessage] =
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
    if (refreshing || batchRunning) {
      return;
    }

    setRefreshing(true);
    setLoadError("");
    setBatchMessage("");

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
    if (batchRunning || refreshing) {
      return;
    }

    const confirmed = window.confirm(
      "현재 DB의 거래·입찰 정보를 기준으로 회사와 딜러의 이탈률을 다시 계산합니다. 위험 등급과 이탈 방지 혜택도 함께 갱신될 수 있습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    setBatchRunning(true);
    setLoadError("");
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
              batchRunning
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
              refreshing
            }
          >
            {batchRunning
              ? "이탈률 계산 중..."
              : "AI 이탈률 다시 계산"}
          </button>
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
