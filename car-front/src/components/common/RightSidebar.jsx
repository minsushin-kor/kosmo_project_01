import { useNavigate } from "react-router-dom";
import { initialSearchCondition } from "./SearchBox";
import "../../css/common/rightSidebar.css";

function RightSidebar({ setSearchCondition, setCurrentPage }) {
  const navigate = useNavigate();

  function applyPopularSearch(type) {
    const nextCondition = { ...initialSearchCondition };

    if (type === "lowPrice") {
      nextCondition.minPrice = 500;
      nextCondition.maxPrice = 2000;
    }

    if (type === "suv") {
      nextCondition.modelName = "스포티지";
    }

    if (type === "lowMileage") {
      nextCondition.mileage = "50000";
    }

    if (type === "gyeonggi") {
      nextCondition.region = "경기도";
    }

    if (type === "recentYear") {
      nextCondition.year = "2021";
    }

    setSearchCondition(nextCondition);
    setCurrentPage(1);
  }

  return (
    <div className="right-sidebar">
      <section className="right-widget">
        <div className="right-widget-title-row">
          <h3>최근 본 차량</h3>
          <button type="button">전체삭제</button>
        </div>

        <div className="recent-car-empty">최근 본 차량이 없습니다.</div>
      </section>

      <section className="right-widget">
        <h3>인기 검색 조건</h3>

        <div className="keyword-list">
          <button type="button" onClick={() => applyPopularSearch("lowPrice")}>
            # 2천만원 이하
          </button>

          <button type="button" onClick={() => applyPopularSearch("suv")}>
            # SUV
          </button>

          <button type="button" onClick={() => applyPopularSearch("lowMileage")}>
            # 5만km 이하
          </button>

          <button type="button" onClick={() => applyPopularSearch("gyeonggi")}>
            # 경기도 매물
          </button>

          <button type="button" onClick={() => applyPopularSearch("recentYear")}>
            # 2021년식 이상
          </button>
        </div>
      </section>

      <section className="right-widget dealer-guide">
        <h3>딜러 매물 등록</h3>
        <p>보유 차량을 등록하고 일반 회원에게 판매할 수 있습니다.</p>

        <button type="button" onClick={() => navigate("/dealer/register-car")}>
          매물 등록하기
        </button>
      </section>

      <section className="right-widget notice-widget">
        <div className="right-widget-title-row">
          <h3>공지사항</h3>

          <button type="button" onClick={() => navigate("/company/notices")}>
            더보기
          </button>
        </div>

        <ul>
          <li onClick={() => navigate("/company/notices")}>
            허위 매물 신고 정책 안내
          </li>
          <li onClick={() => navigate("/company/notices")}>
            딜러 인증 심사 기준 안내
          </li>
          <li onClick={() => navigate("/company/notices")}>
            차량 거래 안전 수칙
          </li>
        </ul>
      </section>
    </div>
  );
}

export default RightSidebar;