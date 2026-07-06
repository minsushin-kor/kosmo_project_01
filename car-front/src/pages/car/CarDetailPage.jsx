import { Link, useParams } from "react-router-dom";
import cars from "../../data/cars";
import "../../css/car/carDetailPage.css";

function CarDetailPage() {
  const { id } = useParams();
  const car = cars.find((item) => item.id === Number(id));

  if (!car) {
    return (
      <main className="car-detail-page">
        <div className="car-detail-empty">
          <h2>차량 정보를 찾을 수 없습니다.</h2>
          <p>삭제되었거나 존재하지 않는 차량입니다.</p>
          <Link to="/" className="back-link">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const detailItems = [
    { label: "제조사", value: car.brand },
    { label: "모델명", value: car.modelName },
    { label: "연식", value: `${car.year}년식` },
    { label: "주행거리", value: `${car.mileage.toLocaleString()}km` },
    { label: "연료", value: car.fuel },
    { label: "변속기", value: car.transmission },
    { label: "배기량", value: car.displacement },
    { label: "색상", value: car.color },
    { label: "사고이력", value: car.accident },
    { label: "지역", value: car.region },
    { label: "차량번호", value: car.carNumber },
    { label: "등록일", value: car.registeredDate },
  ];

  return (
    <main className="car-detail-page">
      <div className="car-detail-top-menu">
        <Link to="/" className="back-link">
          ← 차량 목록으로
        </Link>
      </div>

      <section className="car-detail-hero">
        <div className="car-detail-image">
          <span>{car.imageText}</span>
        </div>

        <div className="car-detail-summary">
          <div className="detail-status-row">
            <span className={`status-badge ${car.status === "판매완료" ? "done" : ""}`}>
              {car.status}
            </span>
            <span className="seller-type-badge">{car.sellerType}</span>
          </div>

          <h1>{car.carName}</h1>
          <p className="detail-sub-info">
            {car.year}년식 · {car.mileage.toLocaleString()}km · {car.fuel} · {car.region}
          </p>

          <div className="detail-price-box">
            <span>판매가</span>
            <strong>{car.price.toLocaleString()}만원</strong>
          </div>

          <div className="detail-action-buttons">
            <button type="button" disabled={car.status === "판매완료"}>
              구매 문의하기
            </button>
            <button type="button" className="outline-button">
              관심 차량 등록
            </button>
          </div>
        </div>
      </section>

      <div className="car-detail-content">
        <section className="detail-panel">
          <h2>차량 기본 정보</h2>

          <div className="detail-info-grid">
            {detailItems.map((item) => (
              <div className="detail-info-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-panel">
          <h2>차량 설명</h2>
          <p className="detail-description">{car.description}</p>
        </section>

        <section className="detail-panel">
          <h2>주요 옵션</h2>

          <div className="option-list">
            {car.options.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>
        </section>

        <aside className="seller-panel">
          <h2>판매자 정보</h2>

          <div className="seller-info-list">
            <div>
              <span>판매자</span>
              <strong>{car.sellerName}</strong>
            </div>
            <div>
              <span>소속</span>
              <strong>{car.companyName}</strong>
            </div>
            <div>
              <span>연락처</span>
              <strong>{car.sellerPhone}</strong>
            </div>
          </div>

          <button type="button" disabled={car.status === "판매완료"}>
            판매자에게 문의
          </button>
        </aside>
      </div>
    </main>
  );
}

export default CarDetailPage;
