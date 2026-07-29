import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import CarCard from "../../components/car/CarCard";
import {
  getPublicCompany,
  getPublicCompanyCars,
  getPublicCompanyDealers,
} from "../../api/companyApi";
import {
  useAuth,
} from "../../hooks/useAuth";
import "../../css/company/companyPage.css";

const companyNotices = [
  {
    id: 1,
    title: "허위 매물 신고 정책 안내",
    description:
      "허위 매물로 의심되는 차량은 관리자 검토 후 비활성화 처리될 수 있습니다.",
    date: "2026-07-01",
  },
  {
    id: 2,
    title: "딜러 인증 심사 기준 안내",
    description:
      "딜러 계정은 소속 회사와 관리자 승인 절차를 거친 뒤 매물 등록이 가능합니다.",
    date: "2026-07-02",
  },
  {
    id: 3,
    title: "차량 거래 안전 수칙",
    description:
      "거래 전 차량 정보, 사고 이력, 판매자 정보를 반드시 확인해 주세요.",
    date: "2026-07-03",
  },
];

function isActiveDealer(
  dealer
) {
  const status =
    String(
      dealer?.status || ""
    ).toUpperCase();

  return (
    !status ||
    status === "정상" ||
    status === "ACTIVE" ||
    status === "NORMAL"
  );
}

function isSellingCar(
  car
) {
  const status =
    String(
      car?.status ||
      car?.saleStatus ||
      ""
    ).toUpperCase();

  return (
    status === "판매중" ||
    status === "SALE" ||
    status === "SELLING" ||
    status === "ON_SALE"
  );
}

function isSoldCar(
  car
) {
  const status =
    String(
      car?.status ||
      car?.saleStatus ||
      ""
    ).toUpperCase();

  return (
    status === "판매완료" ||
    status === "거래완료" ||
    status === "SOLD" ||
    status === "COMPLETED"
  );
}

function CompanyPage() {
  const {
    companyId: routeCompanyId,
  } = useParams();

  const {
    loginUser,
  } = useAuth();

  const companyId =
    routeCompanyId ||
    loginUser?.companyId;

  const [company, setCompany] =
    useState(null);

  const [dealers, setDealers] =
    useState([]);

  const [companyCars, setCompanyCars] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyPage() {
      if (!companyId) {
        if (isMounted) {
          setCompany(null);
          setDealers([]);
          setCompanyCars([]);
          setErrorMessage(
            "조회할 회사 정보가 없습니다."
          );
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          companyResponse,
          dealerResponse,
        ] = await Promise.all([
          getPublicCompany(
            companyId
          ),
          getPublicCompanyDealers(
            companyId
          ),
        ]);

        const activeDealers =
          dealerResponse.filter(
            isActiveDealer
          );

        const carResponse =
          await getPublicCompanyCars(
            activeDealers
          );

        if (!isMounted) {
          return;
        }

        setCompany(
          companyResponse
        );

        setDealers(
          activeDealers
        );

        setCompanyCars(
          carResponse
        );
      } catch (error) {
        console.error(
          "회사 공개 페이지 조회 실패:",
          error
        );

        if (!isMounted) {
          return;
        }

        setCompany(null);
        setDealers([]);
        setCompanyCars([]);

        setErrorMessage(
          error?.message ||
          "회사 정보를 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanyPage();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const sellingCarCount =
    useMemo(() => {
      return companyCars.filter(
        isSellingCar
      ).length;
    }, [companyCars]);

  const soldCarCount =
    useMemo(() => {
      return companyCars.filter(
        isSoldCar
      ).length;
    }, [companyCars]);

  const visibleCars =
    useMemo(() => {
      return companyCars.slice(
        0,
        6
      );
    }, [companyCars]);

  const companyName =
    company?.name ||
    "회사 정보 없음";

  const companyPhone =
    company?.phone ||
    "등록된 연락처 없음";

  const companyAddress =
    company?.address ||
    "등록된 주소 없음";

  const businessNumber =
    company?.businessNumber ||
    "등록된 사업자번호 없음";

  const companyEmail =
    company?.masterEmail ||
    "등록된 이메일 없음";

  if (isLoading) {
    return (
      <main className="company-public-page">
        <div className="company-public-state">
          회사 정보를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !company
  ) {
    return (
      <main className="company-public-page">
        <div className="company-public-state company-public-state-error">
          <h1>
            회사 정보를 불러오지 못했습니다.
          </h1>

          <p>
            {errorMessage ||
              "존재하지 않는 회사입니다."}
          </p>

          <Link to="/">
            홈으로 이동
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="company-public-page">
      <section className="company-public-hero">
        <div className="company-public-hero-profile">
          {company.profileImageUrl ? (
            <img
              src={
                company.profileImageUrl
              }
              alt={`${companyName} 프로필`}
              className="company-public-profile-image"
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
            className="company-public-profile-fallback"
            style={{
              display:
                company.profileImageUrl
                  ? "none"
                  : "flex",
            }}
          >
            {companyName.slice(
              0,
              1
            )}
          </div>
        </div>

        <div className="company-public-hero-text">
          <div className="company-public-badge-row">
            <span className="company-public-badge">
              인증 중고차 판매 회사
            </span>

            {company.goldenBadgeStatus ? (
              <span className="company-public-golden-badge">
                골든 배지
              </span>
            ) : null}
          </div>

          <h1>
            {companyName}
          </h1>

          <p>
            회사 소속 딜러와 등록 차량 정보를
            확인할 수 있는 공개 페이지입니다.
          </p>

          <div className="company-public-hero-actions">
            <a
              href="#company-cars"
              className="company-public-primary-btn"
            >
              매물 보러가기
            </a>

            <a
              href="#company-dealers"
              className="company-public-outline-btn"
            >
              소속 딜러 보기
            </a>
          </div>
        </div>

        <div className="company-public-hero-card">
          <strong>
            회사 정보
          </strong>

          <div className="company-public-info-row">
            <span>
              대표 연락처
            </span>

            <b>
              {companyPhone}
            </b>
          </div>

          <div className="company-public-info-row">
            <span>
              이메일
            </span>

            <b>
              {companyEmail}
            </b>
          </div>

          <div className="company-public-info-row">
            <span>
              주소
            </span>

            <b>
              {companyAddress}
            </b>
          </div>

          <div className="company-public-info-row">
            <span>
              사업자번호
            </span>

            <b>
              {businessNumber}
            </b>
          </div>
        </div>
      </section>

      <section className="company-public-stat-grid">
        <div className="company-public-stat-card">
          <span>
            소속 딜러
          </span>

          <strong>
            {dealers.length}명
          </strong>
        </div>

        <div className="company-public-stat-card">
          <span>
            등록 매물
          </span>

          <strong>
            {companyCars.length}대
          </strong>
        </div>

        <div className="company-public-stat-card">
          <span>
            판매중 매물
          </span>

          <strong>
            {sellingCarCount}대
          </strong>
        </div>

        <div className="company-public-stat-card">
          <span>
            판매 완료
          </span>

          <strong>
            {soldCarCount}대
          </strong>
        </div>
      </section>

      <section className="company-public-section">
        <div className="company-public-section-header">
          <div>
            <h2>
              회사 소개
            </h2>

            <p>
              고객이 확인할 수 있는 회사 소개 영역입니다.
            </p>
          </div>
        </div>

        <div className="company-intro-grid">
          <article className="company-intro-card">
            <h3>
              검증된 딜러
            </h3>

            <p>
              회사 소속 딜러 정보를 관리하고,
              고객이 판매자 정보를 확인할 수
              있도록 구성합니다.
            </p>
          </article>

          <article className="company-intro-card">
            <h3>
              차량 정보 제공
            </h3>

            <p>
              회사 소속 딜러가 등록한 차량
              정보를 확인할 수 있습니다.
            </p>
          </article>

          <article className="company-intro-card">
            <h3>
              회사 정보 공개
            </h3>

            <p>
              대표 연락처, 주소, 사업자번호 등
              실제 등록된 회사 정보를
              제공합니다.
            </p>
          </article>
        </div>
      </section>

      <section
        className="company-public-section"
        id="company-dealers"
      >
        <div className="company-public-section-header">
          <div>
            <h2>
              소속 딜러
            </h2>

            <p>
              현재 공개 가능한 정상 상태
              딜러 목록입니다.
            </p>
          </div>
        </div>

        {dealers.length === 0 ? (
          <div className="company-public-empty">
            등록된 소속 딜러가 없습니다.
          </div>
        ) : (
          <div className="company-dealer-public-grid">
            {dealers
              .slice(0, 4)
              .map((dealer) => {
                const dealerId =
                  dealer.dealerId ||
                  dealer.id;

                return (
                  <Link
                    to={`/company/dealers/${dealerId}`}
                    className="company-dealer-public-card"
                    key={dealerId}
                  >
                    {dealer.profileImageUrl ? (
                      <img
                        src={
                          dealer.profileImageUrl
                        }
                        alt={`${dealer.name} 딜러 프로필`}
                      />
                    ) : (
                      <div className="company-dealer-public-empty">
                        {dealer.name
                          ?.slice(0, 1) ||
                          "딜"}
                      </div>
                    )}

                    <div>
                      <h3>
                        {dealer.name}
                      </h3>

                      <p>
                        {dealer.phone ||
                          "연락처 없음"}
                      </p>
                    </div>

                    <div className="company-dealer-public-meta">
                      <span>
                        {dealer.status ||
                          "정상"}
                      </span>

                      <span>
                        {dealer.tier ||
                          "일반 딜러"}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </section>

      <section
        className="company-public-section"
        id="company-cars"
      >
        <div className="company-public-section-header">
          <div>
            <h2>
              회사 등록 매물
            </h2>

            <p>
              회사 소속 딜러가 등록한 주요
              매물입니다.
            </p>
          </div>
        </div>

        {visibleCars.length === 0 ? (
          <div className="company-public-empty">
            등록된 매물이 없습니다.
          </div>
        ) : (
          <div className="company-public-car-grid">
            {visibleCars.map(
              (car) => (
                <CarCard
                  key={
                    car.carId ||
                    car.id
                  }
                  car={car}
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="company-public-section">
        <div className="company-public-section-header">
          <div>
            <h2>
              공지사항
            </h2>

            <p>
              회사에서 고객에게 안내하는
              공지입니다.
            </p>
          </div>

          <Link to="/company/notices">
            공지 더보기
          </Link>
        </div>

        <div className="company-notice-public-list">
          {companyNotices.map(
            (notice) => (
              <article
                className="company-notice-public-card"
                key={notice.id}
              >
                <div>
                  <h3>
                    {notice.title}
                  </h3>

                  <p>
                    {notice.description}
                  </p>
                </div>

                <span>
                  {notice.date}
                </span>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}

export default CompanyPage;