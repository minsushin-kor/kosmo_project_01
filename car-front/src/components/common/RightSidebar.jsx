import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  initialSearchCondition,
} from "../../data/searchData";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import useAuth from "../../hooks/useAuth";
import {
  clearRecentCarIds,
  getRecentCars,
  getRecommendedCars,
} from "../../utils/carRecommendationStorage";
import "../../css/common/rightSidebar.css";

function MiniCarItem({
  car,
  label,
}) {
  return (
    <Link
      to={`/cars/${car.id}`}
      className="sidebar-car-item"
    >
      <div className="sidebar-car-image">
        {car.imageText || "CAR"}
      </div>

      <div className="sidebar-car-info">
        {label && (
          <span className="sidebar-car-label">
            {label}
          </span>
        )}

        <strong>{car.carName}</strong>

        <p>
          {car.year}년식 ·{" "}
          {Number(
            car.price
          ).toLocaleString()}
          만원
        </p>
      </div>
    </Link>
  );
}

function RightSidebar({
  setSearchCondition,
  setCurrentPage,
  allCars = [],
  candidateCars = [],
}) {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [, setRecentVersion] =
    useState(0);

  const isMember =
    loginUser?.role ===
    AUTH_ROLES.MEMBER;

  const isDealer =
    loginUser?.role ===
    AUTH_ROLES.DEALER;

  useEffect(() => {
    const handleRecentCarChange = () => {
      setRecentVersion(
        (prev) => prev + 1
      );
    };

    window.addEventListener(
      "recent-car-change",
      handleRecentCarChange
    );

    return () => {
      window.removeEventListener(
        "recent-car-change",
        handleRecentCarChange
      );
    };
  }, []);

  const recentCars =
    getRecentCars(
      allCars
    ).slice(0, 3);

  const recommendedCars =
    getRecommendedCars({
      candidateCars,
      allCars,
      loginUser,
      limit: 4,
    });

  function applyPopularSearch(type) {
    const nextCondition = {
      ...initialSearchCondition,
    };

    if (type === "lowPrice") {
      nextCondition.minPrice = 500;
      nextCondition.maxPrice = 2000;
    }

    if (type === "suv") {
      nextCondition.modelName =
        "스포티지";
    }

    if (type === "lowMileage") {
      nextCondition.mileage =
        "50000";
    }

    if (type === "gyeonggi") {
      nextCondition.region =
        "경기도";
    }

    if (type === "recentYear") {
      nextCondition.year = "2021";
    }

    setSearchCondition(nextCondition);
    setCurrentPage(1);
  }

  function handleClearRecentCars() {
    clearRecentCarIds();
  }

  return (
    <div className="right-sidebar">
      <section className="right-widget">
        <div className="right-widget-title-row">
          <h3>최근 본 차량</h3>

          {recentCars.length > 0 && (
            <button
              type="button"
              onClick={
                handleClearRecentCars
              }
            >
              전체삭제
            </button>
          )}
        </div>

        {recentCars.length > 0 ? (
          <div className="sidebar-car-list">
            {recentCars.map((car) => (
              <MiniCarItem
                key={car.id}
                car={car}
              />
            ))}
          </div>
        ) : (
          <div className="recent-car-empty">
            최근 본 차량이 없습니다.
          </div>
        )}
      </section>

      <section className="right-widget recommendation-widget">
        <div className="right-widget-title-row">
          <h3>추천 차량</h3>
          <span>맞춤 추천</span>
        </div>

        <p className="recommendation-guide">
          최근 조회 차량과 회원가입 때
          등록한 선호차량을 기준으로
          추천합니다.
        </p>

        {recommendedCars.length > 0 ? (
          <div className="sidebar-car-list">
            {recommendedCars.map(
              (car) => (
                <MiniCarItem
                  key={car.id}
                  car={car}
                  label="추천"
                />
              )
            )}
          </div>
        ) : (
          <div className="recent-car-empty">
            추천할 차량이 없습니다.
          </div>
        )}
      </section>

      <section className="right-widget">
        <h3>인기 검색 조건</h3>

        <div className="keyword-list">
          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "lowPrice"
              )
            }
          >
            # 2천만원 이하
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch("suv")
            }
          >
            # SUV
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "lowMileage"
              )
            }
          >
            # 5만km 이하
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "gyeonggi"
              )
            }
          >
            # 경기도 매물
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "recentYear"
              )
            }
          >
            # 2021년식 이상
          </button>
        </div>
      </section>

      {isMember && (
        <section className="right-widget dealer-guide">
          <h3>
            내 중고차 매물 등록
          </h3>

          <p>
            보유 차량을 등록하면 회사와
            딜러가 비공개 입찰에
            참여합니다.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/member/register-car"
              )
            }
          >
            중고차 매물 등록하기
          </button>
        </section>
      )}

      {isDealer && (
        <section className="right-widget dealer-guide">
          <h3>딜러 매물 등록</h3>

          <p>
            보유 차량을 등록하고
            일반회원에게 판매할 수
            있습니다.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dealer/register-car"
              )
            }
          >
            딜러 매물 등록하기
          </button>
        </section>
      )}

      <section className="right-widget notice-widget">
        <div className="right-widget-title-row">
          <h3>공지사항</h3>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/company/notices"
              )
            }
          >
            더보기
          </button>
        </div>

        <ul>
          <li
            onClick={() =>
              navigate(
                "/company/notices"
              )
            }
          >
            허위 매물 신고 정책 안내
          </li>

          <li
            onClick={() =>
              navigate(
                "/company/notices"
              )
            }
          >
            딜러 인증 심사 기준 안내
          </li>

          <li
            onClick={() =>
              navigate(
                "/company/notices"
              )
            }
          >
            차량 거래 안전 수칙
          </li>
        </ul>
      </section>
    </div>
  );
}

export default RightSidebar;