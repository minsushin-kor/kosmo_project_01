import { Link } from "react-router-dom";
import "../../css/car/carCard.css";

function CarCard({ car }) {
  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}`} className="car-card-link">
        <div className="car-card-image">
          <span>{car.imageText}</span>
        </div>

        <div className="car-card-body">
          <div className="car-card-title-row">
            <h3>{car.carName}</h3>
            <span className={`status-badge ${car.status === "판매완료" ? "done" : ""}`}>
              {car.status}
            </span>
          </div>

          <ul className="car-card-spec">
            <li>{car.year}년식</li>
            <li>{car.mileage.toLocaleString()}km</li>
            <li>{car.fuel}</li>
            <li>{car.transmission}</li>
          </ul>

          <div className="car-card-meta">
            <span>{car.region}</span>
            <span>{car.sellerType}</span>
          </div>

          <div className="car-card-price-row">
            <strong>{car.price.toLocaleString()}만원</strong>
            <span>상세보기</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default CarCard;