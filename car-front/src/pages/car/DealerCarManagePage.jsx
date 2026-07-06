import { Link } from "react-router-dom";
import cars from "../../data/cars";
import "../../css/car/dealerCarManagePage.css";

function DealerCarManagePage() {
  const dealerCars = cars.filter((car) => car.sellerType !== "일반회원");

  const summary = {
    total: dealerCars.length,
    onSale: dealerCars.filter((car) => car.status === "판매중").length,
    consulting: dealerCars.filter((car) => car.status === "상담중").length,
    sold: dealerCars.filter((car) => car.status === "판매완료").length,
  };

  return (
    <main className="dealer-car-manage-page">
      <div className="dealer-car-manage-container">
        <section className="dealer-car-manage-header">
          <div>
            <p className="page-label">DEALER CAR MANAGEMENT</p>
            <h2>내 매물 관리</h2>
            <p>딜러가 등록한 차량의 판매 상태, 가격, 기본 정보를 관리합니다.</p>
          </div>

          <Link to="/dealer/register-car" className="primary-link-button">
            새 매물 등록
          </Link>
        </section>

        <section className="dealer-summary-grid">
          <article>
            <span>전체 매물</span>
            <strong>{summary.total}</strong>
            <em>대</em>
          </article>
          <article>
            <span>판매중</span>
            <strong>{summary.onSale}</strong>
            <em>대</em>
          </article>
          <article>
            <span>상담중</span>
            <strong>{summary.consulting}</strong>
            <em>대</em>
          </article>
          <article>
            <span>판매완료</span>
            <strong>{summary.sold}</strong>
            <em>대</em>
          </article>
        </section>

        <section className="dealer-car-panel">
          <div className="dealer-car-panel-header">
            <div>
              <h3>등록 매물 목록</h3>
              <p>현재는 임시 데이터 기준이며, 백엔드 연결 시 API 응답으로 교체합니다.</p>
            </div>
          </div>

          <div className="dealer-car-table-wrap">
            <table className="dealer-car-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>연식</th>
                  <th>주행거리</th>
                  <th>지역</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {dealerCars.map((car) => (
                  <tr key={car.id}>
                    <td>
                      <strong>{car.carName}</strong>
                      <span>{car.companyName}</span>
                    </td>
                    <td>{car.year}년식</td>
                    <td>{car.mileage.toLocaleString()}km</td>
                    <td>{car.region}</td>
                    <td>{car.price.toLocaleString()}만원</td>
                    <td>
                      <span className={`dealer-status ${car.status}`}>{car.status}</span>
                    </td>
                    <td>
                      <div className="dealer-table-actions">
                        <Link to={`/cars/${car.id}`}>상세</Link>
                        <button type="button">수정</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DealerCarManagePage;
