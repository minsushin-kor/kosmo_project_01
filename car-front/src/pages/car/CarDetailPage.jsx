import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  saveRecentCarId,
} from "../../utils/carRecommendationStorage";
import { Link, useParams } from "react-router-dom";
import { getCarById } from "../../utils/carViewUtils";
import { useAuth } from "../../hooks/useAuth";
import { AUTH_ROLES } from "../../data/authUser";
import { saveNormalTrade } from "../../utils/normalTradeStorage";
import "../../css/car/carDetailPage.css";

const AUCTION_WINNERS_KEY = "car_front_auction_winners";

function formatDateTime(dateText) {
  if (!dateText) {
    return "미정";
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

function getAuctionRemainText(endDate) {
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
  const minute = Math.floor((diff / (1000 * 60)) % 60);

  if (day > 0) {
    return `${day}일 ${hour}시간 남음`;
  }

  if (hour > 0) {
    return `${hour}시간 ${minute}분 남음`;
  }

  return `${minute}분 남음`;
}

function getAuctionWinners() {
  return JSON.parse(localStorage.getItem(AUCTION_WINNERS_KEY) || "[]");
}

function CarDetailPage() {
  const { id } = useParams();
  const { loginUser } = useAuth();

  const car = getCarById(id);

  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");

  const [bidList, setBidList] = useState(() => {
    const savedBids = JSON.parse(
      localStorage.getItem("car_front_auction_bids") || "[]"
    );

    return savedBids.filter((bid) => bid.carId === Number(id));
  });
  useEffect(() => {
    if (car?.id) {
      saveRecentCarId(car.id);
    }
  }, [car?.id]);
  const auctionWinner = getAuctionWinners().find(
    (winner) => winner.carId === Number(id)
  );

  const myBid = useMemo(() => {
    if (!loginUser) {
      return null;
    }

    const bidderType = loginUser.role || "MEMBER";

    const bidderId =
      loginUser.id ||
      loginUser.memberId ||
      loginUser.dealerId ||
      loginUser.companyId ||
      1;

    return bidList.find(
      (bid) => bid.bidderType === bidderType && bid.bidderId === bidderId
    );
  }, [bidList, loginUser]);

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

  const isDealerCar = Boolean(car.dealerId) && !car.memberId;
  const isMemberCar = Boolean(car.memberId) && !car.dealerId;
  const isAuctionCar = car.saleType === "AUCTION" || isMemberCar;
  const isNormalSaleCar = car.saleType === "NORMAL" || isDealerCar;

  const auction = isAuctionCar
    ? car.auction || {
      auctionId: car.id,
      startPrice: car.price,
      bidCount: 0,
      startDate: car.registeredDate,
      endDate: null,
      status: car.status || "경매중",
      winningBidPrice: null,
      winningBidderName: null,
    }
    : null;

  const remainText = isAuctionCar
    ? getAuctionRemainText(auction.endDate)
    : "일반 판매";

  const originBidCount = isAuctionCar ? auction.bidCount || 0 : 0;
  const totalBidCount = originBidCount + bidList.length;

  const auctionStatus = isAuctionCar
    ? auction.status || car.status || "경매중"
    : "판매중";

  const isAuctionDone =
    isAuctionCar &&
    (Boolean(auctionWinner) ||
      auctionStatus === "경매종료" ||
      auctionStatus === "낙찰완료" ||
      remainText === "경매 종료");

  const sellerType = isDealerCar ? "DEALER" : "MEMBER";
  const sellerId = isDealerCar ? car.dealerId : car.memberId;

  const sellerProfilePath = isDealerCar
    ? `/company/dealers/${car.dealerId}`
    : `/members/${car.memberId}/cars`;

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

  function handleBidSubmit(e) {
    e.preventDefault();

    if (!isAuctionCar) {
      setBidMessage("딜러 판매 매물은 입찰할 수 없습니다.");
      return;
    }

    const priceNumber = Number(bidPrice);

    if (!loginUser) {
      setBidMessage("로그인 후 입찰할 수 있습니다.");
      return;
    }

    if (isAuctionDone) {
      setBidMessage("이미 종료된 경매입니다.");
      return;
    }

    if (
      loginUser.role !== AUTH_ROLES.COMPANY &&
      loginUser.role !== AUTH_ROLES.DEALER
    ) {
      setBidMessage("회사 또는 회사딜러 계정만 입찰할 수 있습니다.");
      return;
    }

    if (!priceNumber) {
      setBidMessage("입찰 금액을 입력해주세요.");
      return;
    }

    if (priceNumber < auction.startPrice) {
      setBidMessage("입찰 금액은 경매 시작가 이상으로 입력해주세요.");
      return;
    }

    if (myBid) {
      setBidMessage(
        "이미 입찰한 차량입니다. 현재 화면에서는 중복 입찰을 막아두었습니다."
      );
      return;
    }

    const bidderType = loginUser.role || "MEMBER";

    const bidderId =
      loginUser.id ||
      loginUser.memberId ||
      loginUser.dealerId ||
      loginUser.companyId ||
      1;

    const bidderName =
      loginUser.name ||
      loginUser.memberName ||
      loginUser.dealerName ||
      loginUser.companyName ||
      "구매자";

    const newBid = {
      id: Date.now(),
      carId: car.id,
      carName: car.carName,
      auctionId: auction.auctionId || car.id,

      bidderType,
      bidderId,
      bidderName,

      bidPrice: priceNumber,
      bidStatus: "입찰완료",
      createdAt: new Date().toISOString(),
    };

    const savedBids = JSON.parse(
      localStorage.getItem("car_front_auction_bids") || "[]"
    );

    const nextBids = [newBid, ...savedBids];

    localStorage.setItem("car_front_auction_bids", JSON.stringify(nextBids));

    window.dispatchEvent(new Event("auction-bid-change"));

    setBidList((prevBids) => [newBid, ...prevBids]);
    setBidPrice("");
    setBidMessage("입찰이 완료되었습니다. 다른 입찰자의 금액은 공개되지 않습니다.");
  }

  function handlePurchaseComplete() {
    if (!loginUser) {
      setTradeMessage("로그인 후 구매할 수 있습니다.");
      return;
    }

    if (loginUser.role !== AUTH_ROLES.MEMBER) {
      setTradeMessage("일반회원 계정만 딜러 매물을 구매할 수 있습니다.");
      return;
    }

    const trade = saveNormalTrade({
      id: `normal-${car.id}-${loginUser.id}`,
      carId: car.id,
      carName: car.carName,
      dealerId: car.dealerId,
      dealerName: car.sellerName,
      companyId: car.companyId,
      companyName: car.companyName,
      buyerId: loginUser.id,
      buyerName: loginUser.name,
      price: car.price,
      status: "구매완료",
      completedAt: new Date().toISOString(),
    });

    setTradeMessage(
      `${trade.carName} 구매완료 처리되었습니다. 딜러 프로필에서 리뷰를 작성할 수 있습니다.`
    );
  }

  function handleMessageClick() {
    const now = new Date().toISOString();

    const buyerType = loginUser?.role || "MEMBER";

    const buyerId =
      loginUser?.id ||
      loginUser?.memberId ||
      loginUser?.dealerId ||
      loginUser?.companyId ||
      1;

    const buyerName =
      loginUser?.name ||
      loginUser?.memberName ||
      loginUser?.dealerName ||
      loginUser?.companyName ||
      "구매자";

    const roomId = `${buyerType}-${buyerId}-${sellerType}-${sellerId}-car-${car.id}`;

    const firstMessageText = `${car.carName} 차량 문의드립니다.`;

    const firstMessage = {
      id: Date.now(),
      roomId,

      sender: "ME",
      senderType: buyerType,
      senderId: buyerId,
      senderName: buyerName,

      receiverType: sellerType,
      receiverId: sellerId,
      receiverName: car.sellerName,

      type: "TEXT",
      text: firstMessageText,
      createdAt: now,
    };

    const savedRooms = JSON.parse(
      localStorage.getItem("car_front_messages") || "[]"
    );

    const hasRoom = savedRooms.some((room) => room.roomId === roomId);

    const nextRooms = hasRoom
      ? savedRooms.map((room) =>
        room.roomId === roomId
          ? {
            ...room,
            lastMessage: firstMessageText,
            updatedAt: now,
            isRead: false,
          }
          : room
      )
      : [
        {
          roomId,

          carId: car.id,
          carName: car.carName,
          carImage: car.image || null,

          sellerType,
          sellerId,
          sellerName: car.sellerName,

          dealerId: isDealerCar ? car.dealerId : null,
          memberId: isMemberCar ? car.memberId : null,
          companyId: isDealerCar ? car.companyId : null,
          companyName: isDealerCar ? car.companyName : "개인 판매",

          buyerType,
          buyerId,
          buyerName,

          lastMessage: firstMessageText,
          messages: [firstMessage],

          createdAt: now,
          updatedAt: now,
          isRead: false,
        },
        ...savedRooms,
      ];

    localStorage.setItem("car_front_messages", JSON.stringify(nextRooms));

    window.dispatchEvent(new Event("message-change"));
    window.dispatchEvent(
      new CustomEvent("message-open", {
        detail: { roomId },
      })
    );
  }

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
            <span className={`status-badge ${isAuctionDone ? "done" : ""}`}>
              {isAuctionCar
                ? auctionWinner
                  ? "낙찰완료"
                  : auctionStatus
                : car.status || "판매중"}
            </span>

            <span className="seller-type-badge">
              {isDealerCar ? "회사딜러 매물" : "일반회원 경매 매물"}
            </span>
          </div>

          <h1>{car.carName}</h1>

          <p className="detail-sub-info">
            {car.year}년식 · {car.mileage.toLocaleString()}km · {car.fuel} ·{" "}
            {car.region}
          </p>

          {isAuctionCar ? (
            <div className="detail-price-box auction-price-box">
              <span>경매 시작가</span>
              <strong>{Number(auction.startPrice).toLocaleString()}만원</strong>
              <p>비공개 입찰 방식이라 다른 입찰자의 금액은 공개되지 않습니다.</p>
            </div>
          ) : (
            <div className="detail-price-box">
              <span>판매 가격</span>
              <strong>{Number(car.price).toLocaleString()}만원</strong>
              <p>회사 소속 딜러가 등록한 일반 판매 차량입니다.</p>
            </div>
          )}

          {isAuctionCar && auctionWinner && (
            <div className="detail-auction-winner-box">
              <h3>낙찰완료</h3>
              <p>
                이 차량은 낙찰 처리가 완료되었습니다.
                <br />
                낙찰가:{" "}
                <strong>{Number(auctionWinner.bidPrice).toLocaleString()}만원</strong>
              </p>
            </div>
          )}

          {isAuctionCar && (
            <div className="auction-summary-grid">
              <div>
                <span>남은 시간</span>
                <strong>{auctionWinner ? "낙찰 처리 완료" : remainText}</strong>
              </div>

              <div>
                <span>입찰 수</span>
                <strong>{totalBidCount}건</strong>
              </div>

              <div>
                <span>입찰 시작일</span>
                <strong>{formatDateTime(auction.startDate)}</strong>
              </div>

              <div>
                <span>입찰 마감일</span>
                <strong>{formatDateTime(auction.endDate)}</strong>
              </div>
            </div>
          )}

          {isAuctionCar ? (
            <form className="bid-form" onSubmit={handleBidSubmit}>
              <label htmlFor="bidPrice">입찰 금액</label>

              <div className="bid-input-row">
                <input
                  id="bidPrice"
                  type="number"
                  min={auction.startPrice}
                  step="10"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder={`${Number(auction.startPrice).toLocaleString()}만원 이상`}
                  disabled={
                    isAuctionDone ||
                    Boolean(myBid) ||
                    ![AUTH_ROLES.COMPANY, AUTH_ROLES.DEALER].includes(loginUser?.role)
                  }
                />

                <span>만원</span>
              </div>

              {myBid && (
                <p className="my-bid-text">
                  내 입찰가: {Number(myBid.bidPrice).toLocaleString()}만원
                </p>
              )}

              {auctionWinner && (
                <p className="bid-message">
                  낙찰이 완료된 차량이라 추가 입찰을 할 수 없습니다.
                </p>
              )}

              {bidMessage && <p className="bid-message">{bidMessage}</p>}

              <div className="detail-action-buttons">
                <button
                  type="submit"
                  disabled={
                    isAuctionDone ||
                    Boolean(myBid) ||
                    ![AUTH_ROLES.COMPANY, AUTH_ROLES.DEALER].includes(loginUser?.role)
                  }
                >
                  입찰하기
                </button>

                <button
                  type="button"
                  className="outline-button"
                  onClick={handleMessageClick}
                >
                  판매자 문의
                </button>
              </div>
            </form>
          ) : (
            <div>
              {tradeMessage && <p className="bid-message">{tradeMessage}</p>}

              <div className="detail-action-buttons">
                <button
                  type="button"
                  onClick={handlePurchaseComplete}
                  disabled={loginUser?.role !== AUTH_ROLES.MEMBER || car.status === "판매완료"}
                >
                  구매완료 테스트
                </button>

                <button
                  type="button"
                  className="outline-button"
                  onClick={handleMessageClick}
                >
                  판매자 문의
                </button>
              </div>
            </div>
          )}
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
            {car.options.length > 0 ? (
              car.options.map((option) => <span key={option}>{option}</span>)
            ) : (
              <span>등록된 옵션 없음</span>
            )}
          </div>
        </section>

        <aside className="seller-panel">
          <h2>판매자 정보</h2>

          <div className="seller-info-list">
            <div>
              <span>판매자</span>

              <Link to={sellerProfilePath} className="seller-info-link">
                {car.sellerName}
              </Link>
            </div>

            <div>
              <span>소속</span>

              {isDealerCar ? (
                <Link to="/company" className="seller-info-link">
                  {car.companyName}
                </Link>
              ) : (
                <strong>개인 판매</strong>
              )}
            </div>

            <div>
              <span>연락처</span>
              <strong>{car.sellerPhone}</strong>
            </div>

            <div>
              <span>거래 방식</span>
              <strong>
                {isNormalSaleCar ? "일반 중고거래" : "기간제 비공개 입찰"}
              </strong>
            </div>
          </div>

          <button type="button" onClick={handleMessageClick}>
            판매자에게 문의
          </button>
        </aside>
      </div>
    </main>
  );
}

export default CarDetailPage;
