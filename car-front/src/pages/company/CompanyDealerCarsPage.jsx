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
  getCompanyDealer,
} from "../../api/dealerApi";
import {
  getPublicDealerCars,
} from "../../api/companyApi";
import {
  mapServerCarToClientCar,
} from "../../api/carApi";
import "../../css/company/companyDealerCarsPage.css";

const DEALER_STATUS_LABEL_MAP = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
};

function normalizeDealer(dealer) {
  if (!dealer) {
    return null;
  }

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
      dealer.imagePreviewUrl ||
      "",

    statusCode,

    status:
      DEALER_STATUS_LABEL_MAP[
      statusCode
      ] || statusCode,
  };
}

function normalizeDealerCars(carList) {
  if (!Array.isArray(carList)) {
    return [];
  }

  return carList
    .map((car) => {
      /*
       * 공개 딜러 차량 API가 서버 원본 구조를
       * 반환하는 경우 기존 CarCard 구조로 변환합니다.
       * 이미 변환된 데이터라면 그대로 사용할 수 있습니다.
       */
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

function CompanyDealerCarsPage() {
  const { dealerId } =
    useParams();

  const [
    dealer,
    setDealer,
  ] = useState(null);

  const [
    dealerCars,
    setDealerCars,
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
    let isActive = true;

    Promise.all([
      getCompanyDealer(
        dealerId
      ),
      getPublicDealerCars(
        dealerId
      ),
    ])
      .then(
        ([
          dealerResponse,
          carResponse,
        ]) => {
          if (!isActive) {
            return;
          }

          setDealer(
            normalizeDealer(
              dealerResponse
            )
          );

          setDealerCars(
            normalizeDealerCars(
              carResponse
            )
          );
        }
      )
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(
          "딜러 매물 화면 조회 실패:",
          error
        );

        setErrorMessage(
          error.message ||
          "딜러 정보와 매물을 불러오지 못했습니다."
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
  }, [dealerId]);

  const carSummary =
    useMemo(() => {
      const sellingCars =
        dealerCars.filter(
          (car) =>
            car.status ===
            "판매중" ||
            car.status ===
            "경매중"
        );

      const counselingCars =
        dealerCars.filter(
          (car) =>
            car.status ===
            "상담중"
        );

      const soldCars =
        dealerCars.filter(
          (car) =>
            car.status ===
            "판매완료" ||
            car.status ===
            "거래완료"
        );

      return {
        sellingCars,
        counselingCars,
        soldCars,
      };
    }, [dealerCars]);

  if (isLoading) {
    return (
      <main className="company-dealer-cars-page">
        <section className="company-dealer-cars-header">
          <div>
            <span>딜러 매물</span>

            <h1>
              딜러 정보를 불러오는 중입니다.
            </h1>

            <p>
              잠시만 기다려주세요.
            </p>
          </div>

          <Link
            to="/company/dealers/public"
            className="company-dealer-cars-back-btn"
          >
            딜러 목록으로
          </Link>
        </section>
      </main>
    );
  }

  if (
    errorMessage ||
    !dealer
  ) {
    return (
      <main className="company-dealer-cars-page">
        <section className="company-dealer-cars-header">
          <div>
            <span>딜러 매물</span>

            <h1>
              딜러 정보를 찾을 수 없습니다.
            </h1>

            <p>
              {errorMessage ||
                "잘못된 딜러 주소이거나 삭제된 딜러입니다."}
            </p>
          </div>

          <Link
            to="/company/dealers/public"
            className="company-dealer-cars-back-btn"
          >
            딜러 목록으로
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="company-dealer-cars-page">
      <section className="company-dealer-cars-header">
        <div>
          <span>딜러 매물</span>

          <h1>
            {dealer.name} 딜러 매물보기
          </h1>

          <p>
            해당 딜러가 등록한 매물만
            모아서 보여줍니다.
          </p>
        </div>

        <div className="company-dealer-cars-header-actions">
          <Link
            to="/company/dealers/public"
            className="company-dealer-cars-outline-btn"
          >
            딜러 목록
          </Link>

          <Link
            to="/company"
            className="company-dealer-cars-back-btn"
          >
            회사 페이지
          </Link>
        </div>
      </section>

      <section className="company-dealer-profile-box">
        <div className="company-dealer-profile-left">
          {dealer.profileImageUrl ? (
            <img
              src={
                dealer.profileImageUrl
              }
              alt="딜러 프로필"
              onError={(
                event
              ) => {
                event.currentTarget.style.display =
                  "none";

                const fallback =
                  event
                    .currentTarget
                    .nextElementSibling;

                if (fallback) {
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
            ).slice(0, 1)}
          </div>

          <div>
            <h2>
              {dealer.name}
            </h2>

            <p>
              {dealer.phone ||
                "연락처 없음"}
            </p>
          </div>
        </div>

        <div className="company-dealer-profile-info">
          <div>
            <span>아이디</span>

            <strong>
              {dealer.loginId}
            </strong>
          </div>

          <div>
            <span>상태</span>

            <strong>
              {dealer.status}
            </strong>
          </div>

          <div>
            <span>등록 매물</span>

            <strong>
              {dealerCars.length}대
            </strong>
          </div>

          <div>
            <span>판매 완료</span>

            <strong>
              {
                carSummary
                  .soldCars
                  .length
              }
              대
            </strong>
          </div>
        </div>
      </section>

      <section className="company-dealer-cars-stat-grid">
        <div className="company-dealer-cars-stat-card">
          <span>전체 매물</span>

          <strong>
            {dealerCars.length}대
          </strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>판매중</span>

          <strong>
            {
              carSummary
                .sellingCars
                .length
            }
            대
          </strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>상담중</span>

          <strong>
            {
              carSummary
                .counselingCars
                .length
            }
            대
          </strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>판매완료</span>

          <strong>
            {
              carSummary
                .soldCars
                .length
            }
            대
          </strong>
        </div>
      </section>

      <section className="company-dealer-cars-section">
        <div className="company-dealer-cars-section-header">
          <div>
            <h2>
              {dealer.name} 딜러 등록 매물
            </h2>

            <p>
              해당 딜러가 DB에 등록한 차량을
              조회합니다.
            </p>
          </div>
        </div>

        {dealerCars.length ===
          0 ? (
          <div className="company-dealer-cars-empty">
            이 딜러가 등록한 매물이
            없습니다.
          </div>
        ) : (
          <div className="company-dealer-cars-grid">
            {dealerCars.map(
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
    </main>
  );
}

export default CompanyDealerCarsPage;