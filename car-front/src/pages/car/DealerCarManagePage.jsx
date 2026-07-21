import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import {
  getAllCars,
  normalizeCar,
} from "../../utils/carViewUtils";
import {
  deleteDealerCarFromStorage,
} from "../../utils/dealerCarStorage";
import "../../css/car/dealerCarManagePage.css";

const DEALER_CAR_STORAGE_KEY =
  "dealerCars";

const LOGIN_DEALER_ID = 1;

function getMyDealerCars() {
  const allCars = getAllCars();

  /*
   * 지금은 로그인 딜러를 임시로
   * dealerId 1번으로 처리합니다.
   *
   * 나중에 백엔드 연결 후
   * loginUser.dealerId 기준으로 변경합니다.
   */
  return allCars
    .filter(
      (car) =>
        Number(car.dealerId) ===
        LOGIN_DEALER_ID &&
        car.saleType === "NORMAL"
    )
    .map((car) =>
      normalizeCar(car)
    )
    .filter(Boolean);
}

function DealerCarManagePage() {
  /*
   * 첫 렌더링 때 바로 매물을 불러옵니다.
   *
   * 기존처럼 빈 배열로 렌더링한 다음
   * useEffect에서 setDealerCars를 실행하지
   * 않으므로 추가 렌더링이 발생하지 않습니다.
   */
  const [
    dealerCars,
    setDealerCars,
  ] = useState(getMyDealerCars);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("전체");

  /*
   * 현재 창이 다시 활성화되거나,
   * 다른 탭에서 dealerCars가 변경된 경우
   * 매물 목록을 다시 불러옵니다.
   *
   * useEffect 내부에서 초기 호출은 하지 않고
   * 외부 이벤트가 발생했을 때만 상태를 변경합니다.
   */
  useEffect(() => {
    function refreshDealerCars() {
      setDealerCars(
        getMyDealerCars()
      );
    }

    function handleFocus() {
      refreshDealerCars();
    }

    function handleStorageChange(
      event
    ) {
      if (
        event.key &&
        event.key !==
        DEALER_CAR_STORAGE_KEY
      ) {
        return;
      }

      refreshDealerCars();
    }

    window.addEventListener(
      "focus",
      handleFocus
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  const summary =
    useMemo(() => {
      const totalCount =
        dealerCars.length;

      const sellingCount =
        dealerCars.filter(
          (car) =>
            car.status ===
            "판매중"
        ).length;

      const reservedCount =
        dealerCars.filter(
          (car) =>
            car.status ===
            "예약중"
        ).length;

      const soldCount =
        dealerCars.filter(
          (car) =>
            car.status ===
            "판매완료"
        ).length;

      return {
        totalCount,
        sellingCount,
        reservedCount,
        soldCount,
      };
    }, [dealerCars]);

  const filteredCars =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      return dealerCars.filter(
        (car) => {
          const carName =
            String(
              car.carName ||
              car.name ||
              ""
            ).toLowerCase();

          const brand =
            String(
              car.brand ||
              car.make ||
              ""
            ).toLowerCase();

          const modelName =
            String(
              car.modelName ||
              car.model ||
              ""
            ).toLowerCase();

          const status =
            car.status ||
            "판매중";

          const keywordMatch =
            keyword === "" ||
            carName.includes(
              keyword
            ) ||
            brand.includes(
              keyword
            ) ||
            modelName.includes(
              keyword
            );

          const statusMatch =
            statusFilter ===
            "전체" ||
            status ===
            statusFilter;

          return (
            keywordMatch &&
            statusMatch
          );
        }
      );
    }, [
      dealerCars,
      searchText,
      statusFilter,
    ]);

  function handleDeleteCar(
    carId
  ) {
    const confirmDelete =
      window.confirm(
        "해당 매물을 삭제하시겠습니까?"
      );

    if (!confirmDelete) {
      return;
    }

    deleteDealerCarFromStorage(
      carId
    );

    setDealerCars(
      (prevCars) =>
        prevCars.filter(
          (car) =>
            String(car.id) !==
            String(carId)
        )
    );

    alert(
      "매물이 삭제되었습니다."
    );
  }

  function handleChangeStatus(
    carId,
    nextStatus
  ) {
    setDealerCars(
      (prevCars) =>
        prevCars.map(
          (car) =>
            String(car.id) ===
              String(carId)
              ? {
                ...car,
                status:
                  nextStatus,
              }
              : car
        )
    );

    alert(
      "지금은 화면에서만 상태가 변경되는 임시 기능입니다."
    );
  }

  function handleResetFilter() {
    setSearchText("");
    setStatusFilter("전체");
  }

  return (
    <main className="dealer-car-manage-page">
      <div className="dealer-car-manage-container">
        <section className="dealer-car-manage-header">
          <div>
            <p className="page-label">
              DEALER SALE
            </p>

            <h2>
              딜러 판매 매물 관리
            </h2>

            <p>
              회사에서 생성한 딜러
              계정이 등록한 일반 판매
              매물을 관리합니다.
            </p>
          </div>

          <Link
            to="/dealer/register-car"
            className="primary-link-button"
          >
            판매 매물 등록
          </Link>
        </section>

        <section className="dealer-summary-grid">
          <article>
            <span>
              전체 매물
            </span>

            <strong>
              {
                summary.totalCount
              }
            </strong>

            <em>대</em>
          </article>

          <article>
            <span>
              판매중
            </span>

            <strong>
              {
                summary.sellingCount
              }
            </strong>

            <em>대</em>
          </article>

          <article>
            <span>
              예약중
            </span>

            <strong>
              {
                summary.reservedCount
              }
            </strong>

            <em>대</em>
          </article>

          <article>
            <span>
              판매완료
            </span>

            <strong>
              {
                summary.soldCount
              }
            </strong>

            <em>대</em>
          </article>
        </section>

        <section className="dealer-car-panel">
          <div className="dealer-car-panel-header">
            <div>
              <h3>
                판매 매물 목록
              </h3>

              <p>
                딜러가 등록한 차량은
                경매가 아니라 판매 가격
                기준으로 문의를 받습니다.
              </p>
            </div>

            <div className="dealer-car-filter-box">
              <input
                type="text"
                value={searchText}
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event.target
                      .value
                  )
                }
                placeholder="차량명, 제조사, 모델명 검색"
              />

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="전체">
                  전체 상태
                </option>

                <option value="판매중">
                  판매중
                </option>

                <option value="예약중">
                  예약중
                </option>

                <option value="판매완료">
                  판매완료
                </option>
              </select>

              <button
                type="button"
                onClick={
                  handleResetFilter
                }
              >
                초기화
              </button>
            </div>
          </div>

          <div className="dealer-car-count">
            총 {filteredCars.length}
            개의 매물이 있습니다.
          </div>

          <div className="dealer-car-table-wrap">
            <table className="dealer-car-table">
              <thead>
                <tr>
                  <th>
                    차량명
                  </th>

                  <th>
                    연식 / 주행거리
                  </th>

                  <th>
                    판매 가격
                  </th>

                  <th>
                    거래 방식
                  </th>

                  <th>
                    등록일
                  </th>

                  <th>
                    상태
                  </th>

                  <th>
                    관리
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCars.length >
                  0 ? (
                  filteredCars.map(
                    (car) => {
                      const status =
                        car.status ||
                        "판매중";

                      return (
                        <tr
                          key={
                            car.id
                          }
                        >
                          <td>
                            <strong>
                              <Link
                                to={`/cars/${car.id}`}
                              >
                                {
                                  car.carName
                                }
                              </Link>
                            </strong>

                            <span>
                              {
                                car.region
                              }
                            </span>
                          </td>

                          <td>
                            <strong>
                              {car.year ||
                                "-"}
                              년식
                            </strong>

                            <span>
                              {Number(
                                car.mileage ||
                                0
                              ).toLocaleString()}
                              km
                            </span>
                          </td>

                          <td>
                            <strong>
                              {Number(
                                car.price ||
                                0
                              ).toLocaleString()}
                              만원
                            </strong>

                            <span>
                              일반 판매가
                            </span>
                          </td>

                          <td>
                            <strong>
                              일반 중고거래
                            </strong>

                            <span>
                              문의 후 거래
                            </span>
                          </td>

                          <td>
                            <strong>
                              {car.registeredDate ||
                                "-"}
                            </strong>

                            <span>
                              등록일
                            </span>
                          </td>

                          <td>
                            <span
                              className={`dealer-status ${status}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            <div className="dealer-table-actions">
                              <Link
                                to={`/cars/${car.id}`}
                              >
                                상세
                              </Link>

                              {status !==
                                "예약중" &&
                                status !==
                                "판매완료" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeStatus(
                                        car.id,
                                        "예약중"
                                      )
                                    }
                                  >
                                    예약
                                  </button>
                                )}

                              {status !==
                                "판매완료" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeStatus(
                                        car.id,
                                        "판매완료"
                                      )
                                    }
                                  >
                                    완료
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCar(
                                    car.id
                                  )
                                }
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty-table-message"
                    >
                      등록된 매물이
                      없습니다.
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