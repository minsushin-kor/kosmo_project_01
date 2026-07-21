import { Link } from "react-router-dom";
import { normalizeCar } from "../../utils/carViewUtils";
import "../../css/car/carCard.css";

function getAuctionRemainText(endDate) {
  if (!endDate) return "마감일 미정";

  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return "경매 종료";

  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return day > 0 ? `${day}일 ${hour}시간 남음` : `${hour}시간 남음`;
}

function CarCard({ car }) {
  const viewCar = normalizeCar(car);
  const isAuction = viewCar.saleType === "AUCTION";
  const auction = viewCar.auction;
  const remainText = isAuction ? getAuctionRemainText(auction?.endDate) : "일반 판매";
  const status = auction?.status || viewCar.status;
  const isDone = ["경매종료", "낙찰완료", "판매완료"].includes(status) || remainText === "경매 종료";

  return (
    <article className="car-card">
      <Link to={`/cars/${viewCar.id}`} className="car-card-link">
        <div className="car-card-image">
          <span>{viewCar.imageText}</span>
        </div>

        <div className="car-card-body">
          <div className="car-card-title-row">
            <h3>{viewCar.carName}</h3>
            <span className={`status-badge ${isDone ? "done" : ""}`}>{status}</span>
          </div>

          <ul className="car-card-spec">
            <li>{viewCar.year}년식</li>
            <li>{viewCar.mileage.toLocaleString()}km</li>
            <li>{viewCar.fuel}</li>
            <li>{viewCar.transmission}</li>
          </ul>

          <div className="car-card-meta">
            <span>{viewCar.region}</span>
            <span>{viewCar.sellerType}</span>
          </div>

          <div className="car-card-auction-info">
            <div>
              <span>{isAuction ? "경매 시작가" : "판매 가격"}</span>
              <strong>{Number(isAuction ? auction?.startPrice : viewCar.price).toLocaleString()}만원</strong>
            </div>

            <div>
              <span>{isAuction ? "입찰" : "거래 방식"}</span>
              <strong>{isAuction ? `${auction?.bidCount || 0}건` : "일반거래"}</strong>
            </div>
          </div>

          <div className="car-card-price-row">
            <strong>{remainText}</strong>
            <span>상세보기</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default CarCard;
