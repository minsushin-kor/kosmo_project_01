import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  getAdminDashboardSummary,
} from "../../api/adminDashboardApi";
import {
  getCompanyChurnUsers,
  getDealerChurnUsers,
} from "../../api/adminChurnApi";
import "../../css/admin/adminDashboardPage.css";

const CAR_STATUS_LABEL_MAP = {
  REGISTERED: "판매중",
  ACTIVE: "판매중",
  SALE: "판매중",
  ON_SALE: "판매중",
  AUCTION: "경매중",
  SOLD: "판매완료",
  COMPLETED: "판매완료",
  RESERVED: "예약중",
  INACTIVE: "비활성",
  SUSPENDED: "정지",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );
}

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "-";
  }

  return `${price.toLocaleString(
    "ko-KR"
  )}만원`;
}

function getCarName(car) {
  return (
    car?.carName ||
    car?.name ||
    [
      car?.manufacturerName,
      car?.modelName,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      car?.make,
      car?.model,
    ]
      .filter(Boolean)
      .join(" ") ||
    `차량 #${car?.id ?? "-"}`
  );
}

function getCompanyName(car) {
  return (
    car?.companyName ||
    car?.company?.name ||
    "-"
  );
}

function getAccountType(car) {
  const normalizedType = String(
    car?.accountType ||
    car?.sellerType ||
    car?.ownerType ||
    car?.registrationType ||
    ""
  ).toUpperCase();

  if (
    normalizedType === "MEMBER" ||
    normalizedType === "ROLE_MEMBER"
  ) {
    return "일반회원";
  }

  if (
    normalizedType === "DEALER" ||
    normalizedType === "ROLE_DEALER"
  ) {
    return "딜러";
  }

  if (
    normalizedType === "COMPANY" ||
    normalizedType === "COMPANY_MASTER" ||
    normalizedType === "ROLE_COMPANY_MASTER"
  ) {
    return "기업";
  }

  if (
    car?.dealerId ||
    car?.dealerName ||
    car?.dealer?.dealerId ||
    car?.dealer?.name
  ) {
    return "딜러";
  }

  if (
    car?.memberId ||
    car?.memberName ||
    car?.member?.memberId ||
    car?.member?.name
  ) {
    return "일반회원";
  }

  if (
    car?.companyId ||
    car?.companyName ||
    car?.company?.companyId ||
    car?.company?.name
  ) {
    return "기업";
  }

  return "-";
}

function getCarPrice(car) {
  return (
    car?.price ??
    car?.salePrice ??
    car?.askingPrice ??
    0
  );
}

function getCarStatus(car) {
  const statusCode = String(
    car?.status || "UNKNOWN"
  ).toUpperCase();

  return {
    statusCode,
    statusLabel:
      CAR_STATUS_LABEL_MAP[statusCode] ||
      car?.status ||
      "-",
  };
}

function getCarCreatedAt(car) {
  return (
    car?.createdAt ||
    car?.registeredAt ||
    car?.registrationDate ||
    null
  );
}

function normalizeRecentCar(car) {
  const {
    statusCode,
    statusLabel,
  } = getCarStatus(car);

  return {
    ...car,
    id:
      car?.id ??
      car?.carId ??
      null,
    companyName:
      getCompanyName(car),
    carName:
      getCarName(car),
    accountType:
      getAccountType(car),
    priceText:
      formatPrice(
        getCarPrice(car)
      ),
    statusCode,
    statusLabel,
    date:
      formatDate(
        getCarCreatedAt(car)
      ),
  };
}

function SummaryChart({ data }) {
  const width = 260;
  const height = 80;
  const padding = 8;

  const chartData =
    Array.isArray(data) &&
      data.length > 0
      ? data
      : [0, 0];

  const max = Math.max(...chartData);
  const min = Math.min(...chartData);

  const denominator = Math.max(
    chartData.length - 1,
    1
  );

  const points = chartData.map(
    (value, index) => {
      const x =
        padding +
        (
          index *
          (width - padding * 2)
        ) /
        denominator;

      const y =
        height -
        padding -
        (
          (value - min) /
          (max - min || 1)
        ) *
        (height - padding * 2);

      return {
        x,
        y,
      };
    }
  );

  const linePoints = points
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
      role="img"
      aria-label="최근 30일 변화 그래프"
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

function getTrendClass(trend) {
  if (trend === "UP") {
    return "up";
  }

  if (trend === "DOWN") {
    return "down";
  }

  return "same";
}

function getTrendSymbol(trend) {
  if (trend === "UP") {
    return "↑";
  }

  if (trend === "DOWN") {
    return "↓";
  }

  return "−";
}

function formatChangeRate(changeRate) {
  const rate = Math.abs(
    Number(changeRate || 0)
  );

  return `${rate.toLocaleString(
    "ko-KR",
    {
      maximumFractionDigits: 1,
    }
  )}%`;
}

async function requestDashboardSections() {
  const [
    dashboardResult,
    companyChurnResult,
    dealerChurnResult,
  ] = await Promise.allSettled([
    getAdminDashboardSummary(),
    getCompanyChurnUsers(),
    getDealerChurnUsers(),
  ]);

  return {
    dashboardResult,
    companyChurnResult,
    dealerChurnResult,
  };
}

function getRequestErrorMessage(
  result,
  fallbackMessage
) {
  if (result.status === "fulfilled") {
    return "";
  }

  return result.reason instanceof Error
    ? result.reason.message
    : fallbackMessage;
}

function AdminDashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    companyChurnUsers,
    setCompanyChurnUsers,
  ] = useState([]);

  const [
    dealerChurnUsers,
    setDealerChurnUsers,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const applyDashboardSections =
    useCallback((results) => {
      const errors = [];

      if (
        results.dashboardResult.status ===
        "fulfilled"
      ) {
        setDashboard(
          results.dashboardResult.value
        );
      } else {
        errors.push(
          getRequestErrorMessage(
            results.dashboardResult,
            "관리자 대시보드 정보를 불러오지 못했습니다."
          )
        );
      }

      if (
        results.companyChurnResult.status ===
        "fulfilled"
      ) {
        setCompanyChurnUsers(
          results.companyChurnResult.value
        );
      } else {
        errors.push(
          getRequestErrorMessage(
            results.companyChurnResult,
            "회사 이탈 위험 데이터를 불러오지 못했습니다."
          )
        );
      }

      if (
        results.dealerChurnResult.status ===
        "fulfilled"
      ) {
        setDealerChurnUsers(
          results.dealerChurnResult.value
        );
      } else {
        errors.push(
          getRequestErrorMessage(
            results.dealerChurnResult,
            "딜러 이탈 위험 데이터를 불러오지 못했습니다."
          )
        );
      }

      setErrorMessage(
        errors.filter(Boolean).join(" ")
      );
    }, []);

  const loadDashboard =
    useCallback(async ({
      showLoading = false,
    } = {}) => {
      if (showLoading) {
        setIsRefreshing(true);
      }

      try {
        const results =
          await requestDashboardSections();

        applyDashboardSections(
          results
        );
      } catch (error) {
        console.error(
          "관리자 대시보드 조회 실패:",
          error
        );

        setErrorMessage(
          error?.message ||
          "관리자 대시보드 정보를 불러오지 못했습니다."
        );
      } finally {
        if (showLoading) {
          setIsRefreshing(false);
        }
      }
    }, [applyDashboardSections]);

  useEffect(() => {
    let isCancelled = false;

    requestDashboardSections()
      .then((results) => {
        if (isCancelled) {
          return;
        }

        applyDashboardSections(
          results
        );
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "관리자 대시보드 조회 실패:",
          error
        );

        setErrorMessage(
          error?.message ||
          "관리자 대시보드 정보를 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [applyDashboardSections]);

  const summaryCards =
    useMemo(() => {
      return Array.isArray(
        dashboard?.summaryCards
      )
        ? dashboard.summaryCards
        : [];
    }, [dashboard]);

  const recentCars =
    useMemo(() => {
      const cars = Array.isArray(
        dashboard?.recentCars
      )
        ? dashboard.recentCars
        : [];

      return cars
        .map(normalizeRecentCar)
        .slice(0, 5);
    }, [dashboard]);

  const recentCarColumns =
    useMemo(
      () => [
        {
          key: "companyName",
          label: "회사명",
          render: (car) => (
            <span className="recent-car-company">
              {car.companyName}
            </span>
          ),
        },
        {
          key: "carName",
          label: "차량명",
          render: (car) => {
            if (!car.id) {
              return (
                <strong className="recent-car-name">
                  {car.carName}
                </strong>
              );
            }

            return (
              <Link
                to={`/cars/${car.id}`}
                className="recent-car-link"
              >
                {car.carName}
              </Link>
            );
          },
        },
        {
          key: "accountType",
          label: "계정유형",
          render: (car) => (
            <span
              className={`recent-account-type ${car.accountType === "일반회원"
                ? "member"
                : car.accountType === "딜러"
                  ? "dealer"
                  : "company"
                }`}
            >
              {car.accountType}
            </span>
          ),
        },
        {
          key: "priceText",
          label: "가격",
          render: (car) => (
            <strong className="recent-car-price">
              {car.priceText}
            </strong>
          ),
        },
        {
          key: "statusLabel",
          label: "상태",
          render: (car) => (
            <span
              className={`recent-car-status status-${car.statusCode.toLowerCase()}`}
            >
              {car.statusLabel}
            </span>
          ),
        },
        {
          key: "date",
          label: "등록일",
        },
      ],
      []
    );

  const companyChurnColumns =
    useMemo(
      () => [
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
          key: "goldenBadgeStatus",
          label: "골든 배지",
          render: (company) =>
            company.goldenBadgeStatus ? (
              <span className="admin-golden-badge">
                🏆 골든 배지
              </span>
            ) : (
              <span className="admin-golden-badge-empty">
                -
              </span>
            ),
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
      ],
      []
    );

  const dealerChurnColumns =
    useMemo(
      () => [
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
      ],
      []
    );

  return (
    <AdminLayout
      title="관리자 대시보드"
      description="DB에 저장된 회원, 기업, 매물, 완료 거래 현황을 조회합니다."
      actions={
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() =>
            loadDashboard({
              showLoading: true,
            })
          }
          disabled={
            isLoading ||
            isRefreshing
          }
        >
          {isRefreshing
            ? "새로고침 중"
            : "새로고침"}
        </button>
      }
    >
      {errorMessage && (
        <section
          className="admin-panel"
          role="alert"
        >
          <p>{errorMessage}</p>
        </section>
      )}

      <section className="admin-summary-grid">
        {isLoading ? (
          <article className="admin-summary-card">
            <div className="summary-card-body">
              <h3>
                대시보드 조회 중
              </h3>

              <p>
                DB 통계 정보를 불러오고
                있습니다.
              </p>
            </div>
          </article>
        ) : (
          summaryCards.map((card) => {
            const trendClass =
              getTrendClass(
                card.trend
              );

            return (
              <article
                className={`admin-summary-card summary-${card.color}`}
                key={card.key}
              >
                <div className="summary-card-header">
                  <div className="summary-icon">
                    {card.icon}
                  </div>

                  <div className="summary-trend-box">
                    <em
                      className={
                        trendClass
                      }
                    >
                      {getTrendSymbol(
                        card.trend
                      )}{" "}
                      {formatChangeRate(
                        card.changeRate
                      )}
                    </em>

                    <span>
                      직전 30일 대비
                    </span>
                  </div>
                </div>

                <div className="summary-card-body">
                  <h3>
                    {card.title}
                  </h3>

                  <div className="summary-value">
                    <strong>
                      {Number(
                        card.value || 0
                      ).toLocaleString(
                        "ko-KR"
                      )}
                    </strong>

                    <span>
                      {card.unit}
                    </span>
                  </div>

                  <p>
                    {card.description}
                  </p>

                  <small>
                    최근 30일{" "}
                    {Number(
                      card
                        .currentPeriodCount ||
                      0
                    ).toLocaleString(
                      "ko-KR"
                    )}
                    건 · 직전 30일{" "}
                    {Number(
                      card
                        .previousPeriodCount ||
                      0
                    ).toLocaleString(
                      "ko-KR"
                    )}
                    건
                  </small>
                </div>

                <SummaryChart
                  data={card.chartData}
                />
              </article>
            );
          })
        )}
      </section>

      <section className="admin-recent-cars-section">
        <article className="admin-panel admin-recent-cars-panel">
          <div className="admin-panel-header recent-cars-header">
            <div>
              <span className="recent-cars-label">
                RECENT LISTINGS
              </span>

              <h3>최근 등록 매물</h3>

              <p>
                DB에 최근 등록된 차량 5건을
                조회합니다.
              </p>
            </div>

            <Link
              to="/cars"
              className="admin-panel-link-btn"
            >
              전체 매물 보기
            </Link>
          </div>

          <div className="recent-cars-table-area">
            <AdminTable
              columns={recentCarColumns}
              data={
                isLoading
                  ? []
                  : recentCars
              }
              pageSize={5}
              emptyMessage={
                isLoading
                  ? "최근 등록 매물을 불러오는 중입니다."
                  : "최근 등록된 매물이 없습니다."
              }
            />
          </div>
        </article>
      </section>

      <section className="admin-churn-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                회사 이탈 위험 회원
              </h3>

              <p>
                FastAPI의 최신 회사 이탈
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

          <AdminTable
            columns={
              companyChurnColumns
            }
            data={
              isLoading
                ? []
                : companyChurnUsers
            }
            emptyMessage={
              isLoading
                ? "회사 이탈 위험 데이터를 불러오는 중입니다."
                : "조회된 회사 이탈 위험 데이터가 없습니다."
            }
          />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>
                딜러 이탈 위험 회원
              </h3>

              <p>
                FastAPI의 최신 딜러 이탈
                예측 결과입니다.
              </p>
            </div>

            <Link
              to="/admin/churn/dealer"
              className="admin-panel-link-btn"
            >
              위험군 관리
            </Link>
          </div>

          <AdminTable
            columns={
              dealerChurnColumns
            }
            data={
              isLoading
                ? []
                : dealerChurnUsers
            }
            emptyMessage={
              isLoading
                ? "딜러 이탈 위험 데이터를 불러오는 중입니다."
                : "조회된 딜러 이탈 위험 데이터가 없습니다."
            }
          />
        </article>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
