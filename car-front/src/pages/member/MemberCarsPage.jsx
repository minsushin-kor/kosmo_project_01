import { Link, useParams } from "react-router-dom";
import cars from "../../data/cars";
import "../../css/member/memberCarsPage.css";

function MemberCarsPage() {
  const { memberId } = useParams();

  const memberCars = cars.filter(
    (car) => car.memberId === Number(memberId)
  );

  const sellerName =
    memberCars.length > 0 ? memberCars[0].sellerName : "판매자 정보 없음";

  return (
    <main className="member-cars-page">
      <section className="member-cars-hero">
        <div>
          <p className="member-cars-label">개인 판매자</p>
          <h1>{sellerName} 판매 매물</h1>
          <p>
            일반 회원이 직접 등록한 차량 매물을 확인하는 페이지
          </p>
        </div>

        <Link to="/" className="member-cars-back-btn">
          차량 목록으로
        </Link>
      </section>

      <section className="member-cars-section">
        <div className="member-cars-section-header">
          <h2>등록 매물</h2>
          <span>{memberCars.length}대</span>
        </div>

        {memberCars.length === 0 ? (
          <div className="member-cars-empty">
            <h3>등록된 매물이 없습니다.</h3>
            <p>판매자가 등록한 차량이 없거나 삭제된 매물입니다.</p>
          </div>
        ) : (
          <div className="member-cars-grid">
            {memberCars.map((car) => (
              <Link
                key={car.id}
                to={`/cars/${car.id}`}
                className="member-car-card"
              >
                <div className="member-car-image">
                  <span>{car.imageText}</span>
                </div>

                <div className="member-car-info">
                  <div className="member-car-status-row">
                    <span className="member-car-status">
                      {car.status}
                    </span>
                    <span className="member-car-seller-type">
                      {car.sellerType}
                    </span>
                  </div>

                  <h3>{car.carName}</h3>

                  <p>
                    {car.year}년식 · {car.mileage.toLocaleString()}km ·{" "}
                    {car.region}
                  </p>

                  <strong>{car.price.toLocaleString()}만원</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MemberCarsPage;