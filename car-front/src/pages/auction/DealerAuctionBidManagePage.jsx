import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import cars from "../../data/cars";
import { getDealerCarsFromStorage } from "../../utils/dealerCarStorage";
import "../../css/auction/dealerAuctionBidManagePage.css";

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

function getCarName(car) {
  return car.name || car.carName || `${car.year} ${car.make} ${car.model}`;
}

function getStartPrice(car) {
  return car.auction?.startPrice || car.sellingprice || car.price || 0;
}

function getAuctionWinners() {
  return JSON.parse(localStorage.getItem(AUCTION_WINNERS_KEY) || "[]");
}

function saveAuctionWinner(winner) {
  const savedWinners = getAuctionWinners();

  const nextWinners = [
    winner,
    ...savedWinners.filter((item) => item.carId !== winner.carId),
  ];

  localStorage.setItem(AUCTION_WINNERS_KEY, JSON.stringify(nextWinners));

  window.dispatchEvent(new Event("auction-winner-change"));
}

function DealerAuctionBidManagePage() {
  const { carId } = useParams();

  const allCars = [...getDealerCarsFromStorage(), ...cars];
  const car = allCars.find((item) => item.id === Number(carId));

  const savedWinner = getAuctionWinners().find(
    (winner) => winner.carId === Number(carId)
  );

  const [winnerBidId, setWinnerBidId] = useState(savedWinner?.bidId || null);

  const savedBids = JSON.parse(
    localStorage.getItem("car_front_auction_bids") || "[]"
  );

  const dummyBids = useMemo(() => {
    if (!car) {
      return [];
    }

    const bidCount = car.auction?.bidCount || 0;
    const startPrice = getStartPrice(car);

    return Array.from({ length: bidCount }).map((_, index) => ({
      id: `dummy-${car.id}-${index + 1}`,
      carId: car.id,
      bidderType: "MEMBER",
      bidderId: 100 + index,
      bidderName: `입찰자${index + 1}`,
      bidPrice: startPrice + (index + 1) * 50,
      bidStatus: "입찰완료",
      createdAt: new Date(
        new Date(car.auction?.startDate || new Date()).getTime() +
        (index + 1) * 1000 * 60 * 40
      ).toISOString(),
      isDummy: true,
    }));
  }, [car]);

  const bidList = useMemo(() => {
    if (!car) {
      return [];
    }

    const realBids = savedBids.filter((bid) => bid.carId === car.id);

    return [...realBids, ...dummyBids].sort(
      (a, b) => Number(b.bidPrice) - Number(a.bidPrice)
    );
  }, [car, savedBids, dummyBids]);

  const highestBid = bidList[0] || null;

  function handleWinnerBid(bid) {
    const confirmWinner = window.confirm(
      `${bid.bidderName} 입찰자를 낙찰자로 처리하시겠습니까?`
    );

    if (!confirmWinner) {
      return;
    }

    const winnerData = {
      id: crypto.randomUUID(),
      carId: car.id,
      auctionId: car.auction?.auctionId || car.id,

      bidId: bid.id,
      bidPrice: Number(bid.bidPrice),
      bidTime: bid.createdAt,

      bidderType: bid.bidderType,
      bidderId: bid.bidderId,
      bidderName: bid.bidderName,

      carName: getCarName(car),
      sellerType: car.sellerType || "딜러",
      sellerId: car.dealerId || car.memberId || 1,
      sellerName: car.sellerName || "판매자",

      status: "낙찰완료",
      createdAt: new Date().toISOString(),
    };

    saveAuctionWinner(winnerData);
    setWinnerBidId(bid.id);

    alert("낙찰 처리되었습니다.");
  }

  if (!car) {
    return (
      <main className="auction-bid-manage-page">
        <div className="auction-bid-container">
          <section className="auction-bid-header">
            <div>
              <p className="auction-page-label">AUCTION BID</p>
              <h2>입찰 현황</h2>
              <p>차량 정보를 찾을 수 없습니다.</p>
            </div>

            <Link to="/dealer/cars" className="auction-primary-link">
              경매 목록으로
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="auction-bid-manage-page">
      <div className="auction-bid-container">
        <section className="auction-bid-header">
          <div>
            <p className="auction-page-label">AUCTION BID</p>
            <h2>입찰 현황</h2>
            <p>{getCarName(car)} 차량에 들어온 비공개 입찰 목록입니다.</p>
          </div>

          <Link to="/dealer/cars" className="auction-primary-link">
            경매 목록으로
          </Link>
        </section>

        <section className="auction-bid-summary-grid">
          <article>
            <span>경매 시작가</span>
            <strong>{Number(getStartPrice(car)).toLocaleString()}</strong>
            <em>만원</em>
          </article>

          <article>
            <span>전체 입찰</span>
            <strong>{bidList.length}</strong>
            <em>건</em>
          </article>

          <article>
            <span>최고 입찰가</span>
            <strong>
              {highestBid ? Number(highestBid.bidPrice).toLocaleString() : 0}
            </strong>
            <em>만원</em>
          </article>

          <article>
            <span>경매 상태</span>
            <strong className="auction-summary-status">
              {savedWinner ? "낙찰완료" : car.auction?.status || car.status || "경매중"}
            </strong>
          </article>
        </section>

        {savedWinner && (
          <section className="auction-winner-box">
            <h3>낙찰 처리 완료</h3>
            <p>
              낙찰자: <strong>{savedWinner.bidderName}</strong> / 낙찰가:{" "}
              <strong>{Number(savedWinner.bidPrice).toLocaleString()}만원</strong>
            </p>
          </section>
        )}

        <section className="auction-bid-panel">
          <div className="auction-bid-panel-header">
            <div>
              <h3>입찰자 목록</h3>
              <p>
                이 화면은 판매자용입니다. 구매자 화면에는 다른 사람의 입찰
                금액이 표시되지 않습니다.
              </p>
            </div>
          </div>

          <div className="auction-bid-table-wrap">
            <table className="auction-bid-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>입찰자</th>
                  <th>입찰 금액</th>
                  <th>입찰 시간</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {bidList.length > 0 ? (
                  bidList.map((bid, index) => {
                    const isHighest = index === 0;
                    const isWinner = winnerBidId === bid.id;

                    return (
                      <tr key={bid.id}>
                        <td>
                          <strong>{index + 1}순위</strong>
                          {isHighest && <span>현재 최고 입찰</span>}
                        </td>

                        <td>
                          <strong>{bid.bidderName}</strong>
                          <span>{bid.bidderType}</span>
                        </td>

                        <td>
                          <strong>
                            {Number(bid.bidPrice).toLocaleString()}만원
                          </strong>
                          <span>
                            {bid.isDummy ? "임시 입찰 데이터" : "저장된 입찰"}
                          </span>
                        </td>

                        <td>
                          <strong>{formatDateTime(bid.createdAt)}</strong>
                        </td>

                        <td>
                          <span
                            className={`auction-bid-status ${isWinner ? "낙찰완료" : bid.bidStatus
                              }`}
                          >
                            {isWinner ? "낙찰완료" : bid.bidStatus}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="auction-action-btn"
                            disabled={Boolean(winnerBidId)}
                            onClick={() => handleWinnerBid(bid)}
                          >
                            낙찰처리
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="auction-empty-message">
                      아직 입찰 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="auction-guide-box">
          <h3>백엔드 연결할 때</h3>
          <p>
            지금은 낙찰 결과를 localStorage에 저장합니다. 나중에는
            최종 거래 생성 API와 경매 상태 변경 API로 연결하면 됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

export default DealerAuctionBidManagePage;