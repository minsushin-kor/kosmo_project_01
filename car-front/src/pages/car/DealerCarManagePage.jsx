import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import cars from "../../data/cars";
import {
  getDealerCarsFromStorage,
  deleteDealerCarFromStorage,
} from "../../utils/dealerCarStorage";
import "../../css/car/dealerCarManagePage.css";

function DealerCarManagePage() {
  const [dealerCars, setDealerCars] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  useEffect(() => {
    const storageCars = getDealerCarsFromStorage();

    // 지금은 임시로 dealerId가 1인 매물만 내 매물로 처리
    const myCars = cars.filter((car) => car.dealerId === 1);

    setDealerCars([...storageCars, ...myCars]);
  }, []);

  function handleDeleteCar(carId) {
    const confirmDelete = window.confirm("해당 매물을 삭제하시겠습니까?");

    if (!confirmDelete) {
      return;
    }

    deleteDealerCarFromStorage(carId);

    setDealerCars((prev) => prev.filter((car) => car.id !== carId));

    alert("매물이 삭제되었습니다.");
  }

  const filteredCars = dealerCars.filter((car) => {
    const carName =
      car.name || car.carName || `${car.year} ${car.make} ${car.model}`;

    const carStatus = car.status || "판매중";

    const keywordMatch =
      carName.includes(searchText) ||
      String(car.make || "").includes(searchText) ||
      String(car.model || "").includes(searchText);

    const statusMatch =
      statusFilter === "전체" || carStatus === statusFilter;

    return keywordMatch && statusMatch;
  });

  return (
    <main className="dealer-car-manage-page">
      <section className="dealer-car-manage-header">
        <div>
          <h2>딜러 매물 관리</h2>
          <p>내가 등록한 차량 매물을 관리합니다.</p>
        </div>

        <Link to="/dealer/register-car" className="dealer-car-add-btn">
          매물 등록
        </Link>
      </section>

      <section className="dealer-car-filter-box">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="차량명, 제조사, 모델명 검색"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="전체">전체 상태</option>
          <option value="판매중">판매중</option>
          <option value="예약중">예약중</option>
          <option value="판매완료">판매완료</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearchText("");
            setStatusFilter("전체");
          }}
        >
          초기화
        </button>
      </section>

      <section className="dealer-car-table-box">
        <div className="dealer-car-count">
          총 {filteredCars.length}개의 매물이 있습니다.
        </div>

        <table className="dealer-car-table">
          <thead>
            <tr>
              <th>차량명</th>
              <th>연식</th>
              <th>주행거리</th>
              <th>가격</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {filteredCars.length > 0 ? (
              filteredCars.map((car) => {
                const carName =
                  car.name ||
                  car.carName ||
                  `${car.year} ${car.make} ${car.model}`;

                const price = car.sellingprice || car.price || 0;
                const mileage = car.odometer || car.mileage || 0;
                const status = car.status || "판매중";

                return (
                  <tr key={car.id}>
                    <td>
                      <Link to={`/cars/${car.id}`}>{carName}</Link>
                    </td>

                    <td>{car.year || "-"}</td>

                    <td>{Number(mileage).toLocaleString()}km</td>

                    <td>{Number(price).toLocaleString()}원</td>

                    <td>
                      <span className={`dealer-status-badge ${status}`}>
                        {status}
                      </span>
                    </td>

                    <td>{car.createdAt || car.date || "-"}</td>

                    <td>
                      <button type="button">수정</button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCar(car.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="empty-table-message">
                  등록된 매물이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default DealerCarManagePage;