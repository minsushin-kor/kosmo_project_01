import {
  initialSearchCondition,
} from "../../data/searchData";
import "../../css/common/searchBox.css";

function SearchBox({ searchCondition, setSearchCondition }) {
  function updateCondition(name, value) {
    setSearchCondition((prevCondition) => ({
      ...prevCondition,
      [name]: value,
    }));
  }

  function handleMinPriceChange(e) {
    const value = Number(e.target.value);

    if (value <= searchCondition.maxPrice - 100) {
      updateCondition("minPrice", value);
    }
  }

  function handleMaxPriceChange(e) {
    const value = Number(e.target.value);

    if (value >= searchCondition.minPrice + 100) {
      updateCondition("maxPrice", value);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
  }

  function handleReset() {
    setSearchCondition(initialSearchCondition);
  }

  return (
    <aside className="search-sidebar">
      <h2>중고차 검색</h2>

      <form className="search-box" onSubmit={handleSearch}>
        <div className="form-group">
          <label>제조사</label>
          <select
            value={searchCondition.brand}
            onChange={(e) => updateCondition("brand", e.target.value)}
          >
            <option value="">전체</option>
            <option value="현대">현대</option>
            <option value="기아">기아</option>
            <option value="제네시스">제네시스</option>
            <option value="르노">르노</option>
            <option value="쉐보레">쉐보레</option>
            <option value="KG모빌리티">KG모빌리티</option>
            <option value="BMW">BMW</option>
            <option value="벤츠">벤츠</option>
            <option value="아우디">아우디</option>
          </select>
        </div>

        <div className="form-group">
          <label>모델명</label>
          <input
            type="text"
            value={searchCondition.modelName}
            onChange={(e) => updateCondition("modelName", e.target.value)}
            placeholder="예: 아반떼, K5"
          />
        </div>

        <div className="form-group">
          <label>지역</label>
          <select
            value={searchCondition.region}
            onChange={(e) => updateCondition("region", e.target.value)}
          >
            <option value="">전체</option>
            <option value="서울특별시">서울특별시</option>
            <option value="경기도">경기도</option>
            <option value="강원도">강원도</option>
            <option value="충청북도">충청북도</option>
            <option value="충청남도">충청남도</option>
            <option value="전라북도">전라북도</option>
            <option value="전라남도">전라남도</option>
            <option value="경상북도">경상북도</option>
            <option value="경상남도">경상남도</option>
          </select>
        </div>

        <div className="form-group">
          <label>연식</label>
          <select
            value={searchCondition.year}
            onChange={(e) => updateCondition("year", e.target.value)}
          >
            <option value="">전체</option>
            <option value="2024">2024년 이상</option>
            <option value="2023">2023년 이상</option>
            <option value="2022">2022년 이상</option>
            <option value="2021">2021년 이상</option>
            <option value="2020">2020년 이상</option>
            <option value="2019">2019년 이상</option>
            <option value="2018">2018년 이상</option>
          </select>
        </div>

        <div className="form-group">
          <label>주행거리</label>
          <select
            value={searchCondition.mileage}
            onChange={(e) => updateCondition("mileage", e.target.value)}
          >
            <option value="">전체</option>
            <option value="10000">1만 km 이하</option>
            <option value="30000">3만 km 이하</option>
            <option value="50000">5만 km 이하</option>
            <option value="70000">7만 km 이하</option>
            <option value="100000">10만 km 이하</option>
            <option value="150000">15만 km 이하</option>
          </select>
        </div>

        <div className="price-range-area">
          <label>
            가격 범위
            <strong>
              {searchCondition.minPrice.toLocaleString()}만원 ~ {" "}
              {searchCondition.maxPrice.toLocaleString()}만원
            </strong>
          </label>

          <div className="dual-range">
            <div className="range-track"></div>

            <div
              className="range-selected"
              style={{
                left: `${(searchCondition.minPrice / 10000) * 100}%`,
                right: `${100 - (searchCondition.maxPrice / 20000) * 100}%`,
              }}
            ></div>

            <input
              type="range"
              min="0"
              max="20000"
              step="100"
              value={searchCondition.minPrice}
              onChange={handleMinPriceChange}
            />

            <input
              type="range"
              min="0"
              max="20000"
              step="100"
              value={searchCondition.maxPrice}
              onChange={handleMaxPriceChange}
            />
          </div>

          <div className="range-labels">
            <span>0만원</span>
            <span>2억원</span>
          </div>
        </div>

        <div className="search-button-area">
          <button type="submit">검색하기</button>
          <button type="button" onClick={handleReset}>
            초기화
          </button>
        </div>
      </form>
    </aside>
  );
}

export default SearchBox;
