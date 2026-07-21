import { useMemo, useState } from "react";
import SearchBox from "../../components/common/SearchBox";
import {
  initialSearchCondition,
} from "../../data/searchData";
import CarCard from "../../components/car/CarCard";
import RightSidebar from "../../components/common/RightSidebar";
import { getAllCars } from "../../utils/carViewUtils";
import { useAuth } from "../../hooks/useAuth";
import { AUTH_ROLES } from "../../data/authUser";
import "../../css/home/indexPage.css";

function IndexPage() {
  const { loginUser } = useAuth();
  const [searchCondition, setSearchCondition] = useState(initialSearchCondition);
  const [sortType, setSortType] = useState("latest");
  const [viewCount, setViewCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const allCars = useMemo(() => getAllCars(), []);

  const roleCars = useMemo(() => {
    if (loginUser?.role === AUTH_ROLES.MEMBER) {
      return allCars.filter(
        (car) => car.saleType === "NORMAL" && car.sellerType === "회사딜러"
      );
    }

    if (
      loginUser?.role === AUTH_ROLES.COMPANY ||
      loginUser?.role === AUTH_ROLES.DEALER
    ) {
      return allCars.filter(
        (car) => car.saleType === "AUCTION" && car.sellerType === "일반회원"
      );
    }

    return allCars;
  }, [allCars, loginUser?.role]);

  const pageGuide = useMemo(() => {
    if (loginUser?.role === AUTH_ROLES.MEMBER) {
      return {
        title: "딜러 판매 차량",
        description: "회사 소속 딜러가 등록한 일반 중고거래 매물입니다.",
      };
    }

    if (
      loginUser?.role === AUTH_ROLES.COMPANY ||
      loginUser?.role === AUTH_ROLES.DEALER
    ) {
      return {
        title: "일반회원 경매 차량",
        description: "일반회원이 등록한 차량에 비공개 입찰할 수 있습니다.",
      };
    }

    return {
      title: "차량 목록",
      description: "로그인 권한에 따라 구매 또는 입찰 가능한 매물이 구분됩니다.",
    };
  }, [loginUser?.role]);

  const filteredCars = useMemo(() => {
    let result = roleCars.filter((car) => {
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
  }, [roleCars, searchCondition, sortType]);

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
              <h2>{pageGuide.title}</h2>
              <p className="car-list-summary">
                {pageGuide.description}<br />
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
                <option value="priceLow">낮은가격순</option>
                <option value="priceHigh">높은가격순</option>
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
                      className={`page-button ${currentPage === page ? "active" : ""
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
            setSearchCondition={
              setSearchCondition
            }
            setCurrentPage={
              setCurrentPage
            }
            allCars={allCars}
            candidateCars={roleCars}
          />
        </aside>
      </section>
    </main>
  );
}

export default IndexPage;