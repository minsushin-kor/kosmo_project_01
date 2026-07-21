import {
  useEffect,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  adminSummaryCards,
  adminCars,
  adminPendingTasks,
} from "../../data/adminData";
import {
  getCompanyChurnUsers,
  getDealerChurnUsers,
} from "../../api/adminChurnApi";
import "../../css/admin/adminDashboardPage.css";

function SummaryChart({
  data,
}) {
  const width = 260;
  const height = 80;
  const padding = 8;

  const safeData =
    Array.isArray(data) &&
    data.length > 0
      ? data
      : [0, 0];

  const max = Math.max(
    ...safeData
  );

  const min = Math.min(
    ...safeData
  );

  const points =
    safeData.map(
      (value, index) => {
        const denominator =
          Math.max(
            1,
            safeData.length - 1
          );

        const x =
          padding +
          (
            index *
            (
              width -
              padding * 2
            )
          ) /
            denominator;

        const y =
          height -
          padding -
          (
            (value - min) /
            (max - min || 1)
          ) *
            (
              height -
              padding * 2
            );

        return {
          x,
          y,
        };
      }
    );

  const linePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

  return (
    <svg
      className="summary-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        className="summary-chart-line"
        points={linePoints}
      />

      {points.map(
        (point, index) => (
          <circle
            key={`${point.x}-${index}`}
            className="summary-chart-dot"
            cx={point.x}
            cy={point.y}
            r="3"
          />
        )
      )}
    </svg>
  );
}

async function requestDashboardChurnUsers() {
  const [
    companyData,
    dealerData,
  ] = await Promise.all([
    getCompanyChurnUsers(),
    getDealerChurnUsers(),
  ]);

  return {
    companyUsers:
      Array.isArray(companyData)
        ? companyData
        : [],

    dealerUsers:
      Array.isArray(dealerData)
        ? dealerData
        : [],
  };
}

const recentCarColumns = [
  {
    key: "carName",
    label: "차량명",
  },
  {
    key: "company",
    label: "회사",
  },
  {
    key: "dealer",
    label: "딜러",
  },
  {
    key: "price",
    label: "가격",
  },
  {
    key: "status",
    label: "상태",

    render: (car) => (
      <span
        className={`admin-status ${car.status}`}
      >
        {car.status}
      </span>
    ),
  },
  {
    key: "date",
    label: "등록일",
  },
];

const companyChurnColumns = [
  {
    key: "memberType",
    label: "회원유형",

    render: (member) =>
      member.memberType ||
      member.type,
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
      <span
        className={`admin-risk ${member.risk}`}
      >
        {member.risk}
      </span>
    ),
  },
  {
    key: "action",
    label: "관리상태",
  },
];

const dealerChurnColumns = [
  {
    key: "memberType",
    label: "회원유형",

    render: (member) =>
      member.memberType ||
      member.type,
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
      <span
        className={`admin-risk ${member.risk}`}
      >
        {member.risk}
      </span>
    ),
  },
  {
    key: "action",
    label: "관리상태",
  },
];

function AdminDashboardPage() {
  const [
    companyChurnUsers,
    setCompanyChurnUsers,
  ] = useState([]);

  const [
    dealerChurnUsers,
    setDealerChurnUsers,
  ] = useState([]);

  const [
    churnLoading,
    setChurnLoading,
  ] = useState(true);

  const [
    churnError,
    setChurnError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardChurnUsers() {
      try {
        const {
          companyUsers,
          dealerUsers,
        } =
          await requestDashboardChurnUsers();

        if (cancelled) {
          return;
        }

        setCompanyChurnUsers(
          companyUsers
        );

        setDealerChurnUsers(
          dealerUsers
        );

        setChurnError("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "관리자 대시보드 이탈 위험 데이터 조회 실패:",
          error
        );

        setCompanyChurnUsers([]);
        setDealerChurnUsers([]);

        setChurnError(
          "이탈 위험 데이터를 불러오지 못했습니다."
        );
      } finally {
        if (!cancelled) {
          setChurnLoading(false);
        }
      }
    }

    loadDashboardChurnUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout
      title="관리자 대시보드"
      description="현재는 백엔드 주소가 없으면 임시데이터를 사용하고, 백엔드 주소가 생기면 API 데이터로 표시됩니다."
      actions={
        <>
          <button
            type="button"
            className="admin-outline-btn"
          >
            요약본 다운로드 추가예정
          </button>

          <button
            type="button"
            className="admin-primary-btn"
          >
            추가기능 필요한것 넣을위치(없으면 삭제)
          </button>
        </>
      }
    >
      <section className="admin-summary-grid">
        {adminSummaryCards.map(
          (card) => (
            <article
              className={`admin-summary-card summary-${card.color}`}
              key={card.title}
            >
              <div className="summary-card-header">
                <div className="summary-icon">
                  {card.icon}
                </div>

                <div className="summary-trend-box">
                  <em
                    className={
                      card.trend
                    }
                  >
                    {card.trend ===
                    "up"
                      ? "↑"
                      : "↓"}{" "}
                    {card.change}
                  </em>

                  <span>
                    {
                      card.changeText
                    }
                  </span>
                </div>
              </div>

              <div className="summary-card-body">
                <h3>
                  {card.title}
                </h3>

                <div className="summary-value">
                  <strong>
                    {card.value}
                  </strong>

                  <span>
                    {card.unit}
                  </span>
                </div>

                <p>
                  {
                    card.description
                  }
                </p>
              </div>

              <SummaryChart
                data={
                  card.chartData
                }
              />
            </article>
          )
        )}
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel admin-large-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                최근 등록 매물
              </h3>

              <p>
                현재날짜 or 전체 목록
                내림차순(DESC)정렬후
                상위 몇건만 끊을예정
              </p>
            </div>

            <button type="button">
              전체보기(내림차순으로 전체
              list?)
            </button>
          </div>

          <AdminTable
            columns={
              recentCarColumns
            }
            data={adminCars.slice(
              0,
              4
            )}
          />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                처리 대기 업무
              </h3>

              <p>
                관리자 확인이 필요한
                항목입니다.
              </p>
            </div>
          </div>

          <ul className="pending-list">
            {adminPendingTasks.map(
              (task) => (
                <li key={task.id}>
                  <span>
                    {task.title}
                  </span>

                  <strong>
                    {task.count}건
                  </strong>
                </li>
              )
            )}
          </ul>
        </article>
      </section>

      <section>
        <article className="admin-panel">
          <h3>
            Api 연결 경로 :
            src/api/adminChurnApi.js
          </h3>

          <p>54번째줄 부터</p>
          <p>추가할게....</p>
        </article>
      </section>

      {churnError && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            border:
              "1px solid #fca5a5",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          {churnError}
        </div>
      )}

      <section className="admin-churn-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                회사 이탈 위험 회원
              </h3>

              <p>
                회사 계정 기준 이탈 위험
                예측 결과입니다.
              </p>
            </div>

            <Link
              to="/admin/churn/company"
              className="admin-panel-link-btn"
            >
              위험군 관리
            </Link>
          </div>

          {churnLoading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              회사 이탈 위험 데이터를
              불러오는 중입니다.
            </div>
          ) : (
            <AdminTable
              columns={
                companyChurnColumns
              }
              data={
                companyChurnUsers
              }
              emptyMessage="조회된 회사 이탈 위험 데이터가 없습니다."
            />
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                딜러 이탈 위험 회원
              </h3>

              <p>
                회사 소속 딜러 기준 이탈
                위험 예측 결과입니다.
              </p>
            </div>

            <Link
              to="/admin/churn/dealer"
              className="admin-panel-link-btn"
            >
              위험군 관리
            </Link>
          </div>

          {churnLoading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              딜러 이탈 위험 데이터를
              불러오는 중입니다.
            </div>
          ) : (
            <AdminTable
              columns={
                dealerChurnColumns
              }
              data={
                dealerChurnUsers
              }
              emptyMessage="조회된 딜러 이탈 위험 데이터가 없습니다."
            />
          )}
        </article>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboardPage;