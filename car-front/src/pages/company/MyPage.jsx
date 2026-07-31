import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { getRoleName } from "../../data/authUser";
import { useAuth } from "../../hooks/useAuth";
import {
  getCompanyDealers,
} from "../../api/dealerApi";
import {
  getPublicCompanyCars,
} from "../../api/companyApi";
import {
  mapServerCarToClientCar,
} from "../../api/carApi";
import "../../css/company/companyMyPage.css";

const DEALER_STATUS_LABEL_MAP = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
};

function normalizeDealer(dealer) {
  const statusCode = String(
    dealer.status || "ACTIVE"
  ).toUpperCase();

  return {
    ...dealer,

    id:
      dealer.dealerId ??
      dealer.id,

    dealerId:
      dealer.dealerId ??
      dealer.id,

    profileImageUrl:
      dealer.profileImageUrl ||
      "",

    statusCode,

    status:
      DEALER_STATUS_LABEL_MAP[
      statusCode
      ] || statusCode,

    carCount: Number(
      dealer.carCount || 0
    ),

    soldCount: Number(
      dealer.soldCount || 0
    ),
  };
}

function normalizeCompanyCars(carList) {
  if (!Array.isArray(carList)) {
    return [];
  }

  return carList
    .map((car) => {
      if (
        car?.brand ||
        car?.modelName ||
        car?.sellerName
      ) {
        return car;
      }

      return mapServerCarToClientCar(
        car
      );
    })
    .filter(Boolean);
}

function getCarName(car) {
  return (
    car.carName ||
    [
      car.brand,
      car.modelName,
    ]
      .filter(Boolean)
      .join(" ") ||
    `차량 #${car.carId || car.id || "-"}`
  );
}

function MyPage() {
  const { loginUser } = useAuth();

  const [
    dealers,
    setDealers,
  ] = useState([]);

  const [
    companyCars,
    setCompanyCars,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    if (!loginUser) {
      return undefined;
    }

    let isActive = true;

    getCompanyDealers()
      .then(async (dealerResult) => {
        if (!isActive) {
          return;
        }

        const dealerList =
          Array.isArray(dealerResult)
            ? dealerResult.map(
              normalizeDealer
            )
            : [];

        setDealers(dealerList);

        const companyId =
          loginUser.companyId ??
          loginUser.id;

        const carResult =
          await getPublicCompanyCars(
            companyId
          );

        if (!isActive) {
          return;
        }

        setCompanyCars(
          normalizeCompanyCars(
            carResult
          )
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(
          "회사 대시보드 조회 실패:",
          error
        );

        setErrorMessage(
          error.message ||
          "회사 대시보드 정보를 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [loginUser]);

  const dashboardData =
    useMemo(() => {
      const activeDealerCount =
        dealers.filter(
          (dealer) =>
            dealer.statusCode ===
            "ACTIVE"
        ).length;

      const stopDealerCount =
        dealers.filter(
          (dealer) =>
            dealer.statusCode ===
            "SUSPENDED"
        ).length;

      const sellingCarCount =
        companyCars.filter(
          (car) =>
            car.status ===
            "판매중" ||
            car.status ===
            "경매중"
        ).length;

      const soldCarCount =
        companyCars.filter(
          (car) =>
            car.status ===
            "판매완료" ||
            car.status ===
            "거래완료"
        ).length;

      const counselingCarCount =
        companyCars.filter(
          (car) =>
            car.status ===
            "상담중"
        ).length;

      return {
        activeDealerCount,
        stopDealerCount,
        sellingCarCount,
        soldCarCount,
        counselingCarCount,
      };
    }, [
      dealers,
      companyCars,
    ]);

  const recentDealers =
    useMemo(
      () =>
        [...dealers]
          .sort(
            (first, second) =>
              Number(
                second.dealerId || 0
              ) -
              Number(
                first.dealerId || 0
              )
          )
          .slice(0, 5),
      [dealers]
    );

  const recentCars =
    useMemo(
      () =>
        [...companyCars]
          .sort(
            (first, second) =>
              Number(
                second.carId ||
                second.id ||
                0
              ) -
              Number(
                first.carId ||
                first.id ||
                0
              )
          )
          .slice(0, 5),
      [companyCars]
    );

  if (!loginUser) {
    return (
      <main className="company-dashboard">
        <section className="company-dashboard-header">
          <div>
            <h1>
              회사 관리 대시보드
            </h1>

            <p>
              로그인이 필요한 페이지입니다.
            </p>
          </div>

          <Link
            to="/login"
            className="company-dashboard-header-btn"
          >
            로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="company-dashboard">
      <section className="company-dashboard-header">
        <div>
          <h1>
            회사 관리 대시보드
          </h1>

          <p>
            회사계정으로 소속 딜러,
            매물 현황, 관리 필요 항목을
            확인합니다.
          </p>
        </div>

        <div className="company-dashboard-header-actions">
          <Link
            to="/company"
            className="company-dashboard-outline-btn"
          >
            공개 회사 페이지
          </Link>

          <Link
            to="/company/dealers/create"
            className="company-dashboard-header-btn"
          >
            딜러 계정 생성
          </Link>
        </div>
      </section>

      {errorMessage && (
        <section
          className="company-dashboard-profile"
          role="alert"
        >
          <p>
            {errorMessage}
          </p>
        </section>
      )}

      <section className="company-dashboard-profile">
        <div className="company-profile-card">
          {loginUser.profileImageUrl ? (
            <img
              src={
                loginUser.profileImageUrl
              }
              alt={`${loginUser.companyName || loginUser.name} 프로필`}
              className="company-profile-image"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";

                const fallback =
                  event.currentTarget
                    .nextElementSibling;

                if (fallback) {
                  fallback.style.display =
                    "flex";
                }
              }}
            />
          ) : null}

          <div
            className="company-profile-icon"
            style={{
              display:
                loginUser.profileImageUrl
                  ? "none"
                  : "flex",
            }}
          >
            회
          </div>

          <div className="company-profile-info">
            <span>
              {getRoleName(
                loginUser.role
              )}
            </span>

            <h2>
              {loginUser.companyName ||
                loginUser.name}
            </h2>

            <p>
              {loginUser.email || "-"}
            </p>
          </div>
        </div>

        <div className="company-info-mini-card">
          <span>아이디</span>

          <strong>
            {loginUser.loginId}
          </strong>
        </div>

        <div className="company-info-mini-card">
          <span>연락처</span>

          <strong>
            {loginUser.phone || "-"}
          </strong>
        </div>

        <div className="company-info-mini-card">
          <span>사업자번호</span>

          <strong>
            {loginUser.businessNumber ||
              "-"}
          </strong>
        </div>
      </section>

      <section className="company-stat-grid">
        <DashboardStatCard
          title="전체 딜러"
          value={
            isLoading
              ? "-"
              : `${dealers.length}명`
          }
        />

        <DashboardStatCard
          title="정상 딜러"
          value={
            isLoading
              ? "-"
              : `${dashboardData.activeDealerCount}명`
          }
        />

        <DashboardStatCard
          title="정지 딜러"
          value={
            isLoading
              ? "-"
              : `${dashboardData.stopDealerCount}명`
          }
        />

        <DashboardStatCard
          title="전체 매물"
          value={
            isLoading
              ? "-"
              : `${companyCars.length}대`
          }
        />

        <DashboardStatCard
          title="판매중"
          value={
            isLoading
              ? "-"
              : `${dashboardData.sellingCarCount}대`
          }
        />

        <DashboardStatCard
          title="상담중"
          value={
            isLoading
              ? "-"
              : `${dashboardData.counselingCarCount}대`
          }
        />

        <DashboardStatCard
          title="판매완료"
          value={
            isLoading
              ? "-"
              : `${dashboardData.soldCarCount}대`
          }
        />
      </section>

      <section className="company-dashboard-grid">
        <div className="company-management-card">
          <h3>관리 메뉴</h3>

          <div className="company-management-list">
            <Link to="/company/dealers">
              <strong>
                딜러 관리
              </strong>

              <span>
                소속 딜러 조회 / 상태 변경
              </span>
            </Link>

            <Link to="/company/dealers/create">
              <strong>
                딜러 계정 생성
              </strong>

              <span>
                회사 소속 딜러 계정 등록
              </span>
            </Link>

            <Link to="/company/notices">
              <strong>
                공지사항 관리
              </strong>

              <span>
                회사 공지 등록 / 수정
              </span>
            </Link>

            <Link to="/company">
              <strong>
                공개 회사 페이지
              </strong>

              <span>
                외부 고객이 보는 회사 페이지
              </span>
            </Link>
          </div>
        </div>

        <div className="company-alert-card">
          <h3>
            관리 필요 항목
          </h3>

          <div className="company-alert-list">
            <div className="company-alert-item normal">
              <span>
                정상 딜러
              </span>

              <strong>
                {
                  dashboardData
                    .activeDealerCount
                }
                명
              </strong>

              <p>
                현재 정상적으로 활동 가능한
                소속 딜러입니다.
              </p>
            </div>

            <div className="company-alert-item warning">
              <span>
                정지 딜러
              </span>

              <strong>
                {
                  dashboardData
                    .stopDealerCount
                }
                명
              </strong>

              <p>
                정지 처리된 딜러 계정을
                확인합니다.
              </p>
            </div>

            <div className="company-alert-item normal">
              <span>
                판매중 매물
              </span>

              <strong>
                {
                  dashboardData
                    .sellingCarCount
                }
                대
              </strong>

              <p>
                현재 판매 또는 경매가 진행
                중인 차량입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="company-table-grid">
        <div className="company-table-card">
          <div className="company-card-header">
            <div>
              <h3>
                최근 소속 딜러
              </h3>

              <p>
                최근 등록된 딜러 목록입니다.
              </p>
            </div>

            <Link to="/company/dealers">
              전체보기
            </Link>
          </div>

          <div className="company-table-wrap">
            <table className="company-dashboard-table">
              <thead>
                <tr>
                  <th>딜러명</th>
                  <th>아이디</th>
                  <th>등록 매물</th>
                  <th>판매 완료</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="company-empty-cell"
                    >
                      딜러 목록을 불러오는
                      중입니다.
                    </td>
                  </tr>
                ) : recentDealers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="company-empty-cell"
                    >
                      등록된 딜러가 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentDealers.map(
                    (dealer) => (
                      <tr
                        key={
                          dealer.dealerId
                        }
                      >
                        <td>
                          <div className="company-dealer-profile">
                            {dealer.profileImageUrl ? (
                              <img
                                src={
                                  dealer.profileImageUrl
                                }
                                alt={`${dealer.name} 딜러 이미지`}
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  const fallback =
                                    event
                                      .currentTarget
                                      .nextElementSibling;

                                  if (
                                    fallback
                                  ) {
                                    fallback.style.display =
                                      "flex";
                                  }
                                }}
                              />
                            ) : null}

                            <div
                              className="company-dealer-profile-empty"
                              style={{
                                display:
                                  dealer.profileImageUrl
                                    ? "none"
                                    : "flex",
                              }}
                            >
                              {String(
                                dealer.name ||
                                "딜"
                              ).slice(
                                0,
                                1
                              )}
                            </div>

                            <span>
                              {dealer.name}
                            </span>
                          </div>
                        </td>

                        <td>
                          {dealer.loginId}
                        </td>

                        <td>
                          {dealer.carCount}대
                        </td>

                        <td>
                          {dealer.soldCount}대
                        </td>

                        <td>
                          <span
                            className={`company-status-badge ${dealer.status}`}
                          >
                            {dealer.status}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="company-table-card">
          <div className="company-card-header">
            <div>
              <h3>
                최근 등록 매물
              </h3>

              <p>
                소속 딜러가 등록한 매물
                현황입니다.
              </p>
            </div>

            <Link to="/">
              매물보기
            </Link>
          </div>

          <div className="company-table-wrap">
            <table className="company-dashboard-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>딜러</th>
                  <th>가격</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="company-empty-cell"
                    >
                      매물 목록을 불러오는
                      중입니다.
                    </td>
                  </tr>
                ) : recentCars.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="company-empty-cell"
                    >
                      등록된 매물이 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentCars.map(
                    (car) => (
                      <tr
                        key={
                          car.carId ||
                          car.id
                        }
                      >
                        <td>
                          {getCarName(car)}
                        </td>

                        <td>
                          {car.sellerName ||
                            car.dealerName ||
                            "-"}
                        </td>

                        <td>
                          {Number(
                            car.price ||
                            0
                          ).toLocaleString(
                            "ko-KR"
                          )}
                          만원
                        </td>

                        <td>
                          <span
                            className={`company-car-status ${car.status}`}
                          >
                            {car.status ||
                              "-"}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardStatCard({
  title,
  value,
}) {
  return (
    <div className="company-stat-card">
      <span>{title}</span>

      <strong>{value}</strong>
    </div>
  );
}

export default MyPage;
