import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCars, normalizeCar } from "../../utils/carViewUtils";
import { deleteDealerCarFromStorage } from "../../utils/dealerCarStorage";
import "../../css/car/dealerCarManagePage.css";

const AUCTION_WINNERS_KEY = "car_front_auction_winners";

function formatDateTime(dateText) {
  if (!dateText) {
    return "-";
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemainText(endDate) {
  if (!endDate) {
    return "마감일 미정";
  }

  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) {
    return "경매 종료";
  }

  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (day > 0) {
    return `${day}일 ${hour}시간 남음`;
  }

  return `${hour}시간 남음`;
}

function getSavedAuctionBids() {
  return JSON.parse(localStorage.getItem("car_front_auction_bids") || "[]");
}

function getAuctionWinners() {
  return JSON.parse(localStorage.getItem(AUCTION_WINNERS_KEY) || "[]");
}

function DealerCarManagePage() {
  const [dealerCars, setDealerCars] = useState([]);
  const [bidList, setBidList] = useState([]);
  const [winnerList, setWinnerList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  function loadDealerCars() {
    const allCars = getAllCars();

    // 지금은 로그인 딜러를 임시로 dealerId 1번으로 처리
    // 나중에 백엔드 연결하면 loginUser.dealerId 기준으로 바꾸면 됨
    const myDealerCars = allCars
      .filter((car) => car.dealerId === 1)
      .map((car) => normalizeCar(car));

    setDealerCars(myDealerCars);
    setBidList(getSavedAuctionBids());
    setWinnerList(getAuctionWinners());
  }

  useEffect(() => {
    loadDealerCars();

    function handleFocus() {
      loadDealerCars();
    }

    function handleStorageChange() {
      loadDealerCars();
    }

    function handleAuctionBidChange() {
      loadDealerCars();
    }

    function handleAuctionWinnerChange() {
      loadDealerCars();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auction-bid-change", handleAuctionBidChange);
    window.addEventListener("auction-winner-change", handleAuctionWinnerChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auction-bid-change", handleAuctionBidChange);
      window.removeEventListener(
        "auction-winner-change",
        handleAuctionWinnerChange
      );
    };
  }, []);

  const summary = useMemo(() => {
    const totalCount = dealerCars.length;

    const activeCount = dealerCars.filter((car) => {
      const winner = winnerList.find((item) => item.carId === car.id);

      if (winner) {
        return false;
      }

      const status = car.auction?.status || car.status;
      const remainText = getRemainText(car.auction?.endDate);

      return status === "경매중" && remainText !== "경매 종료";
    }).length;

    const doneCount = dealerCars.filter((car) => {
      const winner = winnerList.find((item) => item.carId === car.id);

      if (winner) {
        return true;
      }

      const status = car.auction?.status || car.status;
      const remainText = getRemainText(car.auction?.endDate);

      return (
        status === "경매종료" ||
        status === "낙찰완료" ||
        remainText === "경매 종료"
      );
    }).length;

    const totalBidCount = dealerCars.reduce((sum, car) => {
      const originBidCount = car.auction?.bidCount || 0;
      const savedBidCount = bidList.filter((bid) => bid.carId === car.id).length;

      return sum + originBidCount + savedBidCount;
    }, 0);

    return {
      totalCount,
      activeCount,
      doneCount,
      totalBidCount,
    };
  }, [dealerCars, bidList, winnerList]);

  function handleDeleteCar(carId) {
    const confirmDelete = window.confirm("해당 매물을 삭제하시겠습니까?");

    if (!confirmDelete) {
      return;
    }

    deleteDealerCarFromStorage(carId);

    setDealerCars((prev) => prev.filter((car) => car.id !== carId));

    alert("매물이 삭제되었습니다.");
  }

  function handleEndAuction(carId) {
    const confirmEnd = window.confirm("해당 경매를 종료하시겠습니까?");

    if (!confirmEnd) {
      return;
    }

    setDealerCars((prev) =>
      prev.map((car) => {
        if (car.id !== carId) {
          return car;
        }

        return {
          ...car,
          status: "경매종료",
          auction: {
            ...(car.auction || {}),
            status: "경매종료",
            endDate: new Date().toISOString(),
          },
        };
      })
    );

    alert("경매가 종료되었습니다. 지금은 화면에서만 처리되는 임시 기능입니다.");
  }

  const filteredCars = dealerCars.filter((car) => {
    const carName = car.carName || car.name || "";
    const brand = car.brand || car.make || "";
    const modelName = car.modelName || car.model || "";

    const winner = winnerList.find((item) => item.carId === car.id);
    const status = winner ? "낙찰완료" : car.auction?.status || car.status || "경매중";

    const keyword = searchText.trim();

    const keywordMatch =
      keyword === "" ||
      carName.includes(keyword) ||
      brand.includes(keyword) ||
      modelName.includes(keyword);

    const statusMatch = statusFilter === "전체" || status === statusFilter;

    return keywordMatch && statusMatch;
  });

  return (
    <main className="dealer-car-manage-page">
      <div className="dealer-car-manage-container">
        <section className="dealer-car-manage-header">
          <div>
            <p className="page-label">DEALER AUCTION</p>
            <h2>딜러 경매 매물 관리</h2>
            <p>내가 등록한 차량 경매와 비공개 입찰 현황을 관리합니다.</p>
          </div>

          <Link to="/dealer/register-car" className="primary-link-button">
            경매 매물 등록
          </Link>
        </section>

        <section className="dealer-summary-grid">
          <article>
            <span>전체 매물</span>
            <strong>{summary.totalCount}</strong>
            <em>대</em>
          </article>

          <article>
            <span>진행중 경매</span>
            <strong>{summary.activeCount}</strong>
            <em>건</em>
          </article>

          <article>
            <span>종료/낙찰 경매</span>
            <strong>{summary.doneCount}</strong>
            <em>건</em>
          </article>

          <article>
            <span>전체 입찰</span>
            <strong>{summary.totalBidCount}</strong>
            <em>건</em>
          </article>
        </section>

        <section className="dealer-car-panel">
          <div className="dealer-car-panel-header">
            <div>
              <h3>경매 매물 목록</h3>
              <p>
                구매자 화면에는 최고 입찰가가 보이지 않고, 판매자 화면에서만
                입찰 현황을 확인합니다.
              </p>
            </div>

            <div className="dealer-car-filter-box">
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
                <option value="경매예정">경매예정</option>
                <option value="경매중">경매중</option>
                <option value="경매종료">경매종료</option>
                <option value="낙찰완료">낙찰완료</option>
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
            </div>
          </div>

          <div className="dealer-car-count">
            총 {filteredCars.length}개의 매물이 있습니다.
          </div>

          <div className="dealer-car-table-wrap">
            <table className="dealer-car-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>연식 / 주행거리</th>
                  <th>경매 시작가</th>
                  <th>입찰</th>
                  <th>마감일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {filteredCars.length > 0 ? (
                  filteredCars.map((car) => {
                    const auction = car.auction || {};
                    const winner = winnerList.find(
                      (item) => item.carId === car.id
                    );

                    const originBidCount = auction.bidCount || 0;

                    const savedBidCount = bidList.filter(
                      (bid) => bid.carId === car.id
                    ).length;

                    const totalBidCount = originBidCount + savedBidCount;
                    const startPrice = auction.startPrice || car.price || 0;
                    const remainText = getRemainText(auction.endDate);

                    const originStatus = auction.status || car.status || "경매중";
                    const status = winner ? "낙찰완료" : originStatus;

                    const isAuctionDone =
                      status === "경매종료" ||
                      status === "낙찰완료" ||
                      remainText === "경매 종료";

                    return (
                      <tr key={car.id}>
                        <td>
                          <strong>
                            <Link to={`/cars/${car.id}`}>{car.carName}</Link>
                          </strong>
                          <span>{car.region}</span>
                        </td>

                        <td>
                          <strong>{car.year || "-"}년식</strong>
                          <span>
                            {Number(car.mileage || 0).toLocaleString()}km
                          </span>
                        </td>

                        <td>
                          <strong>
                            {Number(startPrice).toLocaleString()}만원
                          </strong>
                          {winner ? (
                            <span>
                              낙찰가 {Number(winner.bidPrice).toLocaleString()}
                              만원
                            </span>
                          ) : (
                            <span>최고가 비공개</span>
                          )}
                        </td>

                        <td>
                          <strong>{totalBidCount}건</strong>
                          <span>
                            기본 {originBidCount}건 / 추가 {savedBidCount}건
                          </span>
                        </td>

                        <td>
                          <strong>{formatDateTime(auction.endDate)}</strong>
                          <span>{winner ? "낙찰 처리 완료" : remainText}</span>
                        </td>

                        <td>
                          <span className={`dealer-status ${status}`}>
                            {status}
                          </span>
                        </td>

                        <td>
                          <div className="dealer-table-actions">
                            <Link to={`/cars/${car.id}`}>상세</Link>

                            <Link to={`/dealer/cars/${car.id}/bids`}>
                              입찰현황
                            </Link>

                            {!isAuctionDone && (
                              <button
                                type="button"
                                onClick={() => handleEndAuction(car.id)}
                              >
                                종료
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteCar(car.id)}
                            >
                              삭제
                            </button>
                          </div>
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
          </div>
        </section>
      </div>
    </main>
  );
}

export default DealerCarManagePage;