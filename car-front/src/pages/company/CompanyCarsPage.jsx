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
} from "../../api/companyApi";
import {
  mapServerCarToClientCar,
} from "../../api/carApi";
import {
  useAuth,
} from "../../hooks/useAuth";
import "../../css/company/companyCarsPage.css";

function normalizeStatus(
  car
) {
  return String(
    car?.status || ""
  ).toUpperCase();
}

function CompanyCarsPage() {
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

  const [companyCars, setCompanyCars] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyCars() {
      if (!companyId) {
        if (isMounted) {
          setCompany(null);
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
          carResponse,
        ] = await Promise.all([
          getPublicCompany(companyId),
          getPublicCompanyCars(companyId),
        ]);

        if (!isMounted) {
          return;
        }

        setCompany(companyResponse);
        setCompanyCars(
          carResponse
            .map(
              mapServerCarToClientCar
            )
            .filter(Boolean)
        );
      } catch (error) {
        console.error(
          "회사 등록 매물 조회 실패:",
          error
        );

        if (!isMounted) {
          return;
        }

        setCompany(null);
        setCompanyCars([]);
        setErrorMessage(
          error?.message ||
          "회사 등록 매물을 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanyCars();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const statusCounts =
    useMemo(() => {
      return companyCars.reduce(
        (counts, car) => {
          const status =
            normalizeStatus(car);

          if (
            status === "판매중" ||
            status === "REGISTERED" ||
            status === "SELLING" ||
            status === "ON_SALE"
          ) {
            counts.selling += 1;
          } else if (
            status === "상담중" ||
            status === "RESERVED" ||
            status === "COUNSELING"
          ) {
            counts.counseling += 1;
          } else if (
            status === "판매완료" ||
            status === "거래완료" ||
            status === "SOLD" ||
            status === "COMPLETED"
          ) {
            counts.sold += 1;
          }

          return counts;
        },
        {
          selling: 0,
          counseling: 0,
          sold: 0,
        }
      );
    }, [companyCars]);

  const companyName =
    company?.name ||
    "회사 정보 없음";

  const companyPagePath =
    companyId
      ? `/companies/${companyId}`
      : "/company";

  if (isLoading) {
    return (
      <main className="company-cars-page">
        <div className="company-cars-empty">
          회사 등록 매물을 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !company
  ) {
    return (
      <main className="company-cars-page">
        <div className="company-cars-empty">
          <strong>
            회사 등록 매물을 불러오지 못했습니다.
          </strong>

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
    <main className="company-cars-page">
      <section className="company-cars-header">
        <div>
          <span>회사 등록 매물</span>

          <h1>
            {companyName} 매물 보기
          </h1>

          <p>
            해당 회사 소속 딜러가 등록한 매물만 모아서 보여줍니다.
          </p>
        </div>

        <Link
          to={companyPagePath}
          className="company-cars-back-btn"
        >
          회사 페이지로
        </Link>
      </section>

      <section className="company-cars-stat-grid">
        <div className="company-cars-stat-card">
          <span>전체 매물</span>
          <strong>
            {companyCars.length}대
          </strong>
        </div>

        <div className="company-cars-stat-card">
          <span>판매중</span>
          <strong>
            {statusCounts.selling}대
          </strong>
        </div>

        <div className="company-cars-stat-card">
          <span>상담중</span>
          <strong>
            {statusCounts.counseling}대
          </strong>
        </div>

        <div className="company-cars-stat-card">
          <span>판매완료</span>
          <strong>
            {statusCounts.sold}대
          </strong>
        </div>
      </section>

      <section className="company-cars-section">
        <div className="company-cars-section-header">
          <div>
            <h2>매물 목록</h2>

            <p>
              회사 소속 딜러가 등록한 실제 DB 매물입니다.
            </p>
          </div>
        </div>

        {companyCars.length === 0 ? (
          <div className="company-cars-empty">
            해당 회사 딜러가 등록한 매물이 없습니다.
          </div>
        ) : (
          <div className="company-cars-grid">
            {companyCars.map(
              (car) => (
                <CarCard
                  key={car.id}
                  car={car}
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default CompanyCarsPage;
