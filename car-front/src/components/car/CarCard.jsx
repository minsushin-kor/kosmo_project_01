import { Link } from "react-router-dom";
import { normalizeCar } from "../../utils/carViewUtils";
import "../../css/car/carCard.css";

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

  if (day > 0) {
    return `${day}일 ${hour}시간 남음`;
  }

  return `${hour}시간 남음`;
}

function CarCard({ car }) {
  const viewCar = normalizeCar(car);
  const auction = viewCar.auction;

  const auctionStatus = auction?.status || viewCar.status;
  const startPrice = auction?.startPrice || viewCar.price;
  const bidCount = auction?.bidCount || 0;
  const remainText = getAuctionRemainText(auction?.endDate);

  const isDone =
    auctionStatus === "경매종료" ||
    auctionStatus === "낙찰완료" ||
    remainText === "경매 종료";

  return (
    <article className="car-card">
      <Link to={`/cars/${viewCar.id}`} className="car-card-link">
        <div className="car-card-image">
          <span>{viewCar.imageText}</span>
        </div>

        <div className="car-card-body">
          <div className="car-card-title-row">
            <h3>{viewCar.carName}</h3>

            <span className={`status-badge ${isDone ? "done" : ""}`}>
              {auctionStatus}
            </span>
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
              <span>경매 시작가</span>
              <strong>{Number(startPrice).toLocaleString()}만원</strong>
            </div>

            <div>
              <span>입찰</span>
              <strong>{bidCount}건</strong>
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