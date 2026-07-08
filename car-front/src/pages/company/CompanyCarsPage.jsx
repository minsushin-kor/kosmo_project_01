import { Link } from "react-router-dom";
import CarCard from "../../components/car/CarCard";
import cars from "../../data/cars";
import { getDealerCarsFromStorage } from "../../utils/dealerCarStorage";
import "../../css/company/companyCarsPage.css";

const DEFAULT_COMPANY_NAME = "Kosmo 인증모터스";

function CompanyCarsPage() {
  const storageCars = getDealerCarsFromStorage();

  const companyCars = [...storageCars, ...cars].filter((car) => {
    return (
      car.companyName === DEFAULT_COMPANY_NAME &&
      (car.sellerType === "딜러" || car.sellerType === "회사 딜러")
    );
  });

  const sellingCars = companyCars.filter((car) => car.status === "판매중");
  const counselingCars = companyCars.filter((car) => car.status === "상담중");
  const soldCars = companyCars.filter((car) => {
    return car.status === "판매완료" || car.status === "거래완료";
  });

  return (
    <main className="company-cars-page">
      <section className="company-cars-header">
        <div>
          <span>회사 등록 매물</span>
          <h1>{DEFAULT_COMPANY_NAME} 매물 보기</h1>
          <p>해당 회사 소속 딜러가 등록한 매물만 모아서 보여줍니다.</p>
        </div>

        <Link to="/company" className="company-cars-back-btn">
          회사 페이지로
        </Link>
      </section>

      <section className="company-cars-stat-grid">
        <div className="company-cars-stat-card">
          <span>전체 매물</span>
          <strong>{companyCars.length}대</strong>
        </div>

        <div className="company-cars-stat-card">
          <span>판매중</span>
          <strong>{sellingCars.length}대</strong>
        </div>

        <div className="company-cars-stat-card">
          <span>상담중</span>
          <strong>{counselingCars.length}대</strong>
        </div>

        <div className="company-cars-stat-card">
          <span>판매완료</span>
          <strong>{soldCars.length}대</strong>
        </div>
      </section>

      <section className="company-cars-section">
        <div className="company-cars-section-header">
          <div>
            <h2>매물 목록</h2>
            <p>현재는 임시데이터의 companyName을 기준으로 필터링합니다.</p>
          </div>
        </div>

        {companyCars.length === 0 ? (
          <div className="company-cars-empty">
            해당 회사 딜러가 등록한 매물이 없습니다.
          </div>
        ) : (
          <div className="company-cars-grid">
            {companyCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CompanyCarsPage;