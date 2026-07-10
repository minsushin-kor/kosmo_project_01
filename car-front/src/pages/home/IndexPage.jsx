import { useMemo, useState } from "react";
import SearchBox, {
  initialSearchCondition,
} from "../../components/common/SearchBox";
import CarCard from "../../components/car/CarCard";
import RightSidebar from "../../components/common/RightSidebar";
import { getAllCars } from "../../utils/carViewUtils";
import "../../css/home/indexPage.css";

function IndexPage() {
  const [searchCondition, setSearchCondition] = useState(initialSearchCondition);
  const [sortType, setSortType] = useState("latest");
  const [viewCount, setViewCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const allCars = useMemo(() => getAllCars(), []);

  const filteredCars = useMemo(() => {
    let result = allCars.filter((car) => {
      const matchBrand =
        searchCondition.brand === "" || car.brand === searchCondition.brand;

      const modelKeyword = searchCondition.modelName.trim().toLowerCase();

      const matchModelName =
        modelKeyword === "" ||
        car.modelName.toLowerCase().includes(modelKeyword) ||
        car.carName.toLowerCase().includes(modelKeyword);

      const matchRegion =
        searchCondition.region === "" || car.region === searchCondition.region;

      const matchMinPrice = car.price >= Number(searchCondition.minPrice);
      const matchMaxPrice = car.price <= Number(searchCondition.maxPrice);

      const matchYear =
        searchCondition.year === "" || car.year >= Number(searchCondition.year);

      const matchMileage =
        searchCondition.mileage === "" ||
        car.mileage <= Number(searchCondition.mileage);

      return (
        matchBrand &&
        matchModelName &&
        matchRegion &&
        matchMinPrice &&
        matchMaxPrice &&
        matchYear &&
        matchMileage
      );
    });

    if (sortType === "latest") {
      result = [...result].sort(
        (a, b) => new Date(b.registeredDate) - new Date(a.registeredDate)
      );
    }

    if (sortType === "priceLow") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortType === "priceHigh") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    if (sortType === "yearHigh") {
      result = [...result].sort((a, b) => b.year - a.year);
    }

    if (sortType === "mileageLow") {
      result = [...result].sort((a, b) => a.mileage - b.mileage);
    }

    return result;
  }, [allCars, searchCondition, sortType]);

  const totalPage = Math.ceil(filteredCars.length / viewCount);
  const startIndex = (currentPage - 1) * viewCount;
  const endIndex = startIndex + viewCount;
  const visibleCars = filteredCars.slice(startIndex, endIndex);
  const pageNumbers = Array.from({ length: totalPage }, (_, index) => index + 1);

  function handleSortChange(e) {
    setSortType(e.target.value);
    setCurrentPage(1);
  }

  function handleViewCountChange(e) {
    setViewCount(Number(e.target.value));
    setCurrentPage(1);
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < totalPage) {
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <main className="index-page">
      <section className="index-main-layout">
        <aside className="left-search-sidebar">
          <SearchBox
            searchCondition={searchCondition}
            setSearchCondition={(condition) => {
              setSearchCondition(condition);
              setCurrentPage(1);
            }}
          />
        </aside>

        <section className="car-list-section">
          <div className="car-list-header">
            <div>
              <h2>차량 목록</h2>
              <p className="car-list-summary">
                총 <strong>{filteredCars.length}</strong>대의 차량이 검색되었습니다.
              </p>
            </div>

            <div className="car-list-control">
              <select
                className="car-sort-select"
                value={sortType}
                onChange={handleSortChange}
              >
                <option value="latest">최근등록순</option>
                <option value="priceLow">낮은시작가순</option>
                <option value="priceHigh">높은시작가순</option>
                <option value="yearHigh">최신연식순</option>
                <option value="mileageLow">주행거리 짧은순</option>
              </select>

              <select
                className="car-sort-select"
                value={viewCount}
                onChange={handleViewCountChange}
              >
                <option value={10}>10개씩 보기</option>
                <option value={15}>15개씩 보기</option>
                <option value={20}>20개씩 보기</option>
              </select>
            </div>
          </div>

          {visibleCars.length > 0 ? (
            <>
              <div className="car-card-list">
                {visibleCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>

              {totalPage > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="page-button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`page-button ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="page-button"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPage}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-result">조건에 맞는 차량이 없습니다.</div>
          )}
        </section>

        <aside className="right-info-sidebar">
          <RightSidebar
            setSearchCondition={setSearchCondition}
            setCurrentPage={setCurrentPage}
          />
        </aside>
      </section>
    </main>
  );
}

export default IndexPage;