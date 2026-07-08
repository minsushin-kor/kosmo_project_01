import { Link, useParams } from "react-router-dom";
import CarCard from "../../components/car/CarCard";
import cars from "../../data/cars";
import { companyDealers } from "../../data/companyData";
import { getCompanyDealersFromStorage } from "../../utils/companyDealerStorage";
import { getDealerCarsFromStorage } from "../../utils/dealerCarStorage";
import "../../css/company/companyDealerCarsPage.css";

function CompanyDealerCarsPage() {
  const { dealerId } = useParams();

  const storageDealers = getCompanyDealersFromStorage();
  const dealers = [...storageDealers, ...companyDealers];

  const dealer = dealers.find((item) => {
    return String(item.id) === String(dealerId);
  });

  const storageCars = getDealerCarsFromStorage();
  const allCars = [...storageCars, ...cars];

  const dealerCars = allCars.filter((car) => {
    return (
      String(car.dealerId) === String(dealerId) ||
      String(car.sellerId) === String(dealerId) ||
      car.sellerName === dealer?.name
    );
  });

  const sellingCars = dealerCars.filter((car) => car.status === "판매중");
  const counselingCars = dealerCars.filter((car) => car.status === "상담중");
  const soldCars = dealerCars.filter((car) => {
    return car.status === "판매완료" || car.status === "거래완료";
  });

  if (!dealer) {
    return (
      <main className="company-dealer-cars-page">
        <section className="company-dealer-cars-header">
          <div>
            <span>딜러 매물</span>
            <h1>딜러 정보를 찾을 수 없습니다.</h1>
            <p>잘못된 딜러 주소이거나 삭제된 딜러입니다.</p>
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
          <h1>{dealer.name} 딜러 매물보기</h1>
          <p>해당 딜러가 등록한 매물만 모아서 보여줍니다.</p>
        </div>

        <div className="company-dealer-cars-header-actions">
          <Link
            to="/company/dealers/public"
            className="company-dealer-cars-outline-btn"
          >
            딜러 목록
          </Link>

          <Link to="/company" className="company-dealer-cars-back-btn">
            회사 페이지
          </Link>
        </div>
      </section>

      <section className="company-dealer-profile-box">
        <div className="company-dealer-profile-left">
          {dealer.imagePreviewUrl ? (
            <img src={dealer.imagePreviewUrl} alt="딜러 프로필" />
          ) : (
            <div className="company-dealer-profile-empty">
              {dealer.name.slice(0, 1)}
            </div>
          )}

          <div>
            <h2>{dealer.name}</h2>
            <p>{dealer.phone}</p>
          </div>
        </div>

        <div className="company-dealer-profile-info">
          <div>
            <span>아이디</span>
            <strong>{dealer.loginId}</strong>
          </div>

          <div>
            <span>상태</span>
            <strong>{dealer.status}</strong>
          </div>

          <div>
            <span>등록 매물</span>
            <strong>{dealerCars.length}대</strong>
          </div>

          <div>
            <span>판매 완료</span>
            <strong>{soldCars.length}대</strong>
          </div>
        </div>
      </section>

      <section className="company-dealer-cars-stat-grid">
        <div className="company-dealer-cars-stat-card">
          <span>전체 매물</span>
          <strong>{dealerCars.length}대</strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>판매중</span>
          <strong>{sellingCars.length}대</strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>상담중</span>
          <strong>{counselingCars.length}대</strong>
        </div>

        <div className="company-dealer-cars-stat-card">
          <span>판매완료</span>
          <strong>{soldCars.length}대</strong>
        </div>
      </section>

      <section className="company-dealer-cars-section">
        <div className="company-dealer-cars-section-header">
          <div>
            <h2>{dealer.name} 딜러 등록 매물</h2>
            <p>현재는 임시데이터의 dealerId, sellerId, sellerName 기준으로 필터링합니다.</p>
          </div>
        </div>

        {dealerCars.length === 0 ? (
          <div className="company-dealer-cars-empty">
            이 딜러가 등록한 매물이 없습니다.
          </div>
        ) : (
          <div className="company-dealer-cars-grid">
            {dealerCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CompanyDealerCarsPage;