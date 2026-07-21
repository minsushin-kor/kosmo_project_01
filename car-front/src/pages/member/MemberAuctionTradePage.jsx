import {
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  getCarById,
} from "../../utils/carViewUtils";
import "../../css/member/memberAuctionTradePage.css";

const AUCTION_WINNERS_KEY =
  "car_front_auction_winners";

const FINAL_DEALS_KEY =
  "car_front_final_deals";

function readStorageArray(
  storageKey
) {
  try {
    const savedValue =
      localStorage.getItem(
        storageKey
      );

    if (!savedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(savedValue);

    return Array.isArray(
      parsedValue
    )
      ? parsedValue
      : [];
  } catch (error) {
    console.error(
      `${storageKey} 데이터 불러오기 실패:`,
      error
    );

    localStorage.removeItem(
      storageKey
    );

    return [];
  }
}

function getAuctionWinners() {
  return readStorageArray(
    AUCTION_WINNERS_KEY
  );
}

function getFinalDeals() {
  return readStorageArray(
    FINAL_DEALS_KEY
  );
}

function saveFinalDeal(
  deal
) {
  const savedDeals =
    getFinalDeals();

  const nextDeals = [
    deal,

    ...savedDeals.filter(
      (item) =>
        String(
          item.winnerId
        ) !==
        String(
          deal.winnerId
        )
    ),
  ];

  localStorage.setItem(
    FINAL_DEALS_KEY,
    JSON.stringify(
      nextDeals
    )
  );

  window.dispatchEvent(
    new Event(
      "final-deal-change"
    )
  );
}

function formatDateTime(
  dateText
) {
  if (!dateText) {
    return "-";
  }

  const date =
    new Date(dateText);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateText;
  }

  return date.toLocaleString(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function createDealInfo(
  winner
) {
  if (!winner) {
    return null;
  }

  const winningPrice =
    Number(
      winner.bidPrice || 0
    );

  const feeRate = 3;

  const feePrice =
    Math.floor(
      winningPrice *
        (feeRate / 100)
    );

  const totalPrice =
    winningPrice +
    feePrice;

  return {
    winningPrice,
    feeRate,
    feePrice,
    totalPrice,
  };
}

function createFinalDeal({
  winner,
  savedDeal,
  dealInfo,
  status,
}) {
  const now =
    new Date().toISOString();

  return {
    id:
      savedDeal?.id ||
      crypto.randomUUID(),

    winnerId:
      winner.id,

    auctionId:
      winner.auctionId,

    carId:
      winner.carId,

    carName:
      winner.carName,

    buyerType:
      winner.bidderType,

    buyerId:
      winner.bidderId,

    buyerName:
      winner.bidderName,

    sellerType:
      winner.sellerType,

    sellerId:
      winner.sellerId,

    sellerName:
      winner.sellerName,

    winningPrice:
      dealInfo.winningPrice,

    feeRate:
      dealInfo.feeRate,

    feePrice:
      dealInfo.feePrice,

    totalPrice:
      dealInfo.totalPrice,

    status,

    createdAt:
      savedDeal?.createdAt ||
      now,

    updatedAt:
      now,
  };
}

function MemberAuctionTradePage() {
  const {
    winnerId,
  } = useParams();

  const {
    loginUser,
  } = useAuth();

  const winner =
    getAuctionWinners().find(
      (item) =>
        String(item.id) ===
        String(winnerId)
    );

  const car =
    getCarById(
      winner?.carId
    );

  const savedDeal =
    getFinalDeals().find(
      (item) =>
        String(
          item.winnerId
        ) ===
        String(winnerId)
    );

  const dealInfo =
    createDealInfo(
      winner
    );

  const [
    dealStatus,
    setDealStatus,
  ] = useState(
    savedDeal?.status ||
      "결제대기"
  );

  function handleCreatePaymentWaiting() {
    if (
      !winner ||
      !dealInfo
    ) {
      return;
    }

    const nextDeal =
      createFinalDeal({
        winner,
        savedDeal,
        dealInfo,
        status:
          "결제대기",
      });

    saveFinalDeal(
      nextDeal
    );

    setDealStatus(
      "결제대기"
    );

    alert(
      "최종 거래가 결제대기 상태로 저장되었습니다."
    );
  }

  function handlePaymentDone() {
    if (
      !winner ||
      !dealInfo
    ) {
      return;
    }

    const nextDeal =
      createFinalDeal({
        winner,
        savedDeal,
        dealInfo,
        status:
          "결제완료",
      });

    saveFinalDeal(
      nextDeal
    );

    setDealStatus(
      "결제완료"
    );

    alert(
      "임시 결제완료 처리되었습니다."
    );
  }

  if (
    !winner ||
    !dealInfo
  ) {
    return (
      <main className="member-trade-page">
        <div className="member-trade-container">
          <section className="member-trade-empty">
            <h2>
              거래 정보를 찾을 수 없습니다.
            </h2>

            <p>
              낙찰 결과가 없거나 삭제된 거래입니다.
            </p>

            <Link to="/member/auction-bids">
              내 입찰 차량으로
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="member-trade-page">
      <div className="member-trade-container">
        <section className="member-trade-header">
          <div>
            <p className="page-label">
              FINAL DEAL
            </p>

            <h2>
              최종 거래 / 결제 대기
            </h2>

            <p>
              낙찰된 차량 기준으로 최종 거래 정보를 확인합니다.
            </p>
          </div>

          <Link
            to="/member/auction-bids"
            className="member-trade-outline-link"
          >
            내 입찰 차량
          </Link>
        </section>

        <section className="member-trade-status-box">
          <div>
            <span>
              현재 거래 상태
            </span>

            <strong
              className={`member-trade-status ${dealStatus}`}
            >
              {dealStatus}
            </strong>
          </div>

          <p>
            지금은 localStorage 기준 임시 처리입니다. 나중에 백엔드 연결 시
            최종 거래 생성 API, 결제 상태 변경 API로 교체하면 됩니다.
          </p>
        </section>

        <section className="member-trade-grid">
          <article className="member-trade-card">
            <h3>
              차량 정보
            </h3>

            <div className="member-trade-car-box">
              <div className="member-trade-car-image">
                {car?.imageText ||
                  "CAR"}
              </div>

              <div>
                <strong>
                  {
                    winner.carName
                  }
                </strong>

                <span>
                  {car
                    ? `${car.year}년식 · ${car.region} · ${Number(
                        car.mileage ||
                          0
                      ).toLocaleString()}km`
                    : "차량 상세정보 없음"}
                </span>

                {car && (
                  <Link
                    to={`/cars/${car.id}`}
                  >
                    차량 상세보기
                  </Link>
                )}
              </div>
            </div>
          </article>

          <article className="member-trade-card">
            <h3>
              거래 대상
            </h3>

            <dl className="member-trade-info-list">
              <div>
                <dt>
                  구매자
                </dt>

                <dd>
                  {
                    winner.bidderName
                  }
                </dd>
              </div>

              <div>
                <dt>
                  구매자 유형
                </dt>

                <dd>
                  {
                    winner.bidderType
                  }
                </dd>
              </div>

              <div>
                <dt>
                  판매자
                </dt>

                <dd>
                  {
                    winner.sellerName
                  }
                </dd>
              </div>

              <div>
                <dt>
                  판매자 유형
                </dt>

                <dd>
                  {
                    winner.sellerType
                  }
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="member-trade-card member-trade-payment-card">
          <div className="member-trade-card-header">
            <div>
              <h3>
                결제 예정 금액
              </h3>

              <p>
                낙찰가와 임시 수수료를 기준으로 계산합니다.
              </p>
            </div>
          </div>

          <dl className="member-trade-price-list">
            <div>
              <dt>
                낙찰가
              </dt>

              <dd>
                {dealInfo.winningPrice.toLocaleString()}
                만원
              </dd>
            </div>

            <div>
              <dt>
                수수료율
              </dt>

              <dd>
                {
                  dealInfo.feeRate
                }
                %
              </dd>
            </div>

            <div>
              <dt>
                수수료
              </dt>

              <dd>
                {dealInfo.feePrice.toLocaleString()}
                만원
              </dd>
            </div>

            <div className="total">
              <dt>
                총 결제 예정 금액
              </dt>

              <dd>
                {dealInfo.totalPrice.toLocaleString()}
                만원
              </dd>
            </div>
          </dl>

          <div className="member-trade-actions">
            <button
              type="button"
              className="member-trade-outline-btn"
              onClick={
                handleCreatePaymentWaiting
              }
            >
              결제대기 저장
            </button>

            <button
              type="button"
              className="member-trade-primary-btn"
              onClick={
                handlePaymentDone
              }
              disabled={
                dealStatus ===
                "결제완료"
              }
            >
              {dealStatus ===
              "결제완료"
                ? "결제완료됨"
                : "임시 결제완료 처리"}
            </button>
          </div>
        </section>

        <section className="member-trade-card">
          <h3>
            거래 기록
          </h3>

          <dl className="member-trade-info-list">
            <div>
              <dt>
                낙찰 처리 시간
              </dt>

              <dd>
                {formatDateTime(
                  winner.createdAt
                )}
              </dd>
            </div>

            <div>
              <dt>
                입찰 시간
              </dt>

              <dd>
                {formatDateTime(
                  winner.bidTime
                )}
              </dd>
            </div>

            <div>
              <dt>
                현재 로그인 계정
              </dt>

              <dd>
                {loginUser?.name ||
                  "로그인 사용자"}
              </dd>
            </div>

            <div>
              <dt>
                최종 거래 저장 여부
              </dt>

              <dd>
                {savedDeal
                  ? "저장됨"
                  : "아직 저장 안됨"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}

export default MemberAuctionTradePage;