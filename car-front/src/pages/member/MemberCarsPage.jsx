import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  getPublicMemberCars,
} from "../../api/carApi";
import "../../css/member/memberCarsPage.css";

function MemberCarsPage() {
  const { memberId } = useParams();

  const [memberCars, setMemberCars] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMemberCars() {
      setLoading(true);
      setErrorMessage("");

      try {
        const cars =
          await getPublicMemberCars(
            memberId
          );

        if (!active) {
          return;
        }

        setMemberCars(
          cars.filter(
            (car) =>
              car.ownerType === "MEMBER" &&
              car.saleType === "AUCTION" &&
              car.status !== "삭제"
          )
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error?.message ||
          "판매자의 등록 차량을 불러오지 못했습니다."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMemberCars();

    return () => {
      active = false;
    };
  }, [memberId]);

  const sellerName = useMemo(() => {
    if (memberCars.length === 0) {
      return "일반회원";
    }

    return (
      memberCars[0].sellerName ||
      memberCars[0].ownerName ||
      "일반회원"
    );
  }, [memberCars]);

  return (
    <main className="member-cars-page">
      <section className="member-cars-hero">
        <div>
          <p className="member-cars-label">
            개인 판매자
          </p>

          <h1>
            {sellerName} 판매 매물
          </h1>

          <p>
            일반 회원이 직접 등록한 경매
            차량을 확인하는 페이지입니다.
          </p>
        </div>

        <Link
          to="/"
          className="member-cars-back-btn"
        >
          차량 목록으로
        </Link>
      </section>

      <section className="member-cars-section">
        <div className="member-cars-section-header">
          <h2>등록 매물</h2>

          <span>
            {memberCars.length}대
          </span>
        </div>

        {loading ? (
          <div className="member-cars-empty">
            <h3>
              등록 매물을 불러오는
              중입니다.
            </h3>
          </div>
        ) : errorMessage ? (
          <div className="member-cars-empty">
            <h3>
              매물을 불러오지 못했습니다.
            </h3>

            <p>{errorMessage}</p>
          </div>
        ) : memberCars.length === 0 ? (
          <div className="member-cars-empty">
            <h3>
              등록된 매물이 없습니다.
            </h3>

            <p>
              판매자가 등록한 차량이 없거나
              삭제된 매물입니다.
            </p>
          </div>
        ) : (
          <div className="member-cars-grid">
            {memberCars.map((car) => {
              const imageUrl =
                car.imageUrl ||
                car.images?.[0]
                  ?.imageUrl ||
                "";

              const imageText =
                car.imageText ||
                car.modelName ||
                car.model ||
                "CAR";

              return (
                <Link
                  key={car.id}
                  to={`/cars/${car.id}`}
                  className="member-car-card"
                >
                  <div className="member-car-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={
                          car.carName ||
                          "차량 이미지"
                        }
                        loading="lazy"
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

                    <span
                      className="member-car-image-fallback"
                      style={{
                        display: imageUrl
                          ? "none"
                          : "flex",
                      }}
                    >
                      {imageText}
                    </span>
                  </div>

                  <div className="member-car-info">
                    <div className="member-car-status-row">
                      <span className="member-car-status">
                        {car.status}
                      </span>

                      <span className="member-car-seller-type">
                        {car.sellerType ||
                          "일반회원"}
                      </span>
                    </div>

                    <h3>
                      {car.carName}
                    </h3>

                    <p>
                      {car.year || "-"}년식
                      {" · "}
                      {Number(
                        car.mileage || 0
                      ).toLocaleString()}
                      km
                      {" · "}
                      {car.region || "-"}
                    </p>

                    <strong>
                      {Number(
                        car.price || 0
                      ).toLocaleString()}
                      만원
                    </strong>

                    {car.auction && (
                      <div className="member-car-auction-info">
                        <span>
                          입찰{" "}
                          {Number(
                            car.bidCount ??
                            car.auction
                              .bidCount ??
                            0
                          ).toLocaleString()}
                          건
                        </span>

                        {(car.endTime ||
                          car.auction
                            .endDate) && (
                            <span>
                              종료{" "}
                              {new Date(
                                car.endTime ||
                                car.auction
                                  .endDate
                              ).toLocaleString(
                                "ko-KR"
                              )}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MemberCarsPage;