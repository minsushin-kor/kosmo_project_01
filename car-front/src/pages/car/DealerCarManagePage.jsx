import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  deleteCar,
  getMyCars,
  updateMyDealerCarStatus,
} from "../../api/carApi";
import {
  approvePurchaseRequest,
  getReceivedPurchaseRequests,
} from "../../api/transactionApi";
import "../../css/car/dealerCarManagePage.css";

const STATUS_OPTIONS = [
  {
    label: "전체 상태",
    value: "전체",
  },
  {
    label: "판매중",
    value: "판매중",
  },
  {
    label: "판매완료",
    value: "판매완료",
  },
];

const SERVER_STATUS_MAP = {
  판매중: "REGISTERED",
};

function formatRequestDate(dateText) {
  if (!dateText) {
    return "-";
  }

  const date = new Date(dateText);

  return Number.isNaN(date.getTime())
    ? dateText
    : date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
}

function formatDealPrice(priceValue) {
  const price = Number(priceValue || 0);

  if (price >= 100000) {
    return `${price.toLocaleString()}원`;
  }

  return `${price.toLocaleString()}만원`;
}

function DealerCarManagePage() {
  const [dealerCars, setDealerCars] = useState([]);
  const [
    purchaseRequests,
    setPurchaseRequests,
  ] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("전체");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [
    processingCarId,
    setProcessingCarId,
  ] = useState(null);
  const [
    approvingRequestId,
    setApprovingRequestId,
  ] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDealerCars() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [
          myCars,
          receivedRequests,
        ] = await Promise.all([
          getMyCars(),
          getReceivedPurchaseRequests(),
        ]);

        if (!active) {
          return;
        }

        setDealerCars(
          myCars.filter(
            (car) =>
              car.saleType === "NORMAL" &&
              car.ownerType === "DEALER" &&
              car.status !== "삭제"
          )
        );
        setPurchaseRequests(
          receivedRequests
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error?.message ||
          "등록 매물을 불러오지 못했습니다."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDealerCars();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      totalCount: dealerCars.length,

      sellingCount: dealerCars.filter(
        (car) => car.status === "판매중"
      ).length,

      soldCount: dealerCars.filter(
        (car) => car.status === "판매완료"
      ).length,
    }),
    [dealerCars]
  );

  const filteredCars = useMemo(() => {
    const keyword = searchText
      .trim()
      .toLowerCase();

    return dealerCars.filter((car) => {
      const searchableText = [
        car.carName,
        car.brand,
        car.modelName,
      ]
        .join(" ")
        .toLowerCase();

      const keywordMatch =
        !keyword ||
        searchableText.includes(keyword);

      const statusMatch =
        statusFilter === "전체" ||
        car.status === statusFilter;

      return keywordMatch && statusMatch;
    });
  }, [
    dealerCars,
    searchText,
    statusFilter,
  ]);

  async function handleChangeStatus(
    carId,
    nextStatus
  ) {
    const serverStatus =
      SERVER_STATUS_MAP[nextStatus];

    if (
      !serverStatus ||
      processingCarId !== null
    ) {
      return;
    }

    setProcessingCarId(carId);

    try {
      const updatedCar =
        await updateMyDealerCarStatus(
          carId,
          serverStatus
        );

      setDealerCars((currentCars) =>
        currentCars.map((car) =>
          String(car.id) === String(carId)
            ? updatedCar
            : car
        )
      );
    } catch (error) {
      alert(
        error?.message ||
        "차량 상태를 변경하지 못했습니다."
      );
    } finally {
      setProcessingCarId(null);
    }
  }

  async function handleDeleteCar(carId) {
    if (processingCarId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "해당 매물을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    setProcessingCarId(carId);

    try {
      await deleteCar(carId);

      setDealerCars((currentCars) =>
        currentCars.filter(
          (car) =>
            String(car.id) !== String(carId)
        )
      );

      alert("매물이 삭제되었습니다.");
    } catch (error) {
      alert(
        error?.message ||
        "매물을 삭제하지 못했습니다."
      );
    } finally {
      setProcessingCarId(null);
    }
  }

  async function handleApproveRequest(
    request
  ) {
    if (
      !request?.transactionId ||
      approvingRequestId !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      `${request.carMake || ""} ${request.carModel || "차량"} 구매 요청을 승인하시겠습니까?\n승인하면 해당 차량은 판매완료 처리됩니다.`
    );

    if (!confirmed) {
      return;
    }

    setApprovingRequestId(
      request.transactionId
    );

    try {
      const approved =
        await approvePurchaseRequest(
          request.transactionId
        );

      setPurchaseRequests(
        (currentRequests) =>
          currentRequests.filter(
            (item) =>
              String(item.carId) !==
              String(approved.carId)
          )
      );
      setDealerCars(
        (currentCars) =>
          currentCars.map((car) =>
            String(car.id) ===
            String(approved.carId)
              ? {
                ...car,
                status:
                  "판매완료",
              }
              : car
          )
      );

      alert(
        "구매 요청을 승인하고 판매완료 처리했습니다."
      );
    } catch (error) {
      alert(
        error?.message ||
        "구매 요청을 승인하지 못했습니다."
      );
    } finally {
      setApprovingRequestId(null);
    }
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

            <h2>딜러 판매 매물 관리</h2>

            <p>
              로그인한 딜러가 등록한 일반
              판매 매물을 조회하고 상태를
              관리합니다.
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
            <span>전체 매물</span>
            <strong>
              {summary.totalCount}
            </strong>
            <em>대</em>
          </article>

          <article>
            <span>판매중</span>
            <strong>
              {summary.sellingCount}
            </strong>
            <em>대</em>
          </article>

          <article>
            <span>판매완료</span>
            <strong>
              {summary.soldCount}
            </strong>
            <em>대</em>
          </article>

          <article>
            <span>대기 중 구매 요청</span>
            <strong>
              {purchaseRequests.length}
            </strong>
            <em>건</em>
          </article>
        </section>

        <section className="dealer-car-panel dealer-purchase-request-panel">
          <div className="dealer-car-panel-header">
            <div>
              <h3>받은 구매 요청</h3>

              <p>
                회원의 구매 요청을 확인한 뒤 승인할 수 있습니다.
                승인하면 차량이 판매완료로 변경됩니다.
              </p>
            </div>
          </div>

          <div className="dealer-car-table-wrap">
            <table className="dealer-car-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>요청 회원</th>
                  <th>구매 금액</th>
                  <th>요청 시간</th>
                  <th>처리</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      구매 요청을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : purchaseRequests.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-table-message"
                    >
                      대기 중인 구매 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  purchaseRequests.map(
                    (request) => (
                      <tr
                        key={
                          request.transactionId
                        }
                      >
                        <td>
                          <strong>
                            <Link
                              to={`/cars/${request.carId}`}
                            >
                              {[
                                request.carMake,
                                request.carModel,
                              ]
                                .filter(Boolean)
                                .join(" ") ||
                                "차량"}
                            </Link>
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {request.buyerName ||
                              "회원"}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {formatDealPrice(
                              request.dealPrice
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {formatRequestDate(
                              request.createdAt
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="dealer-table-actions">
                            <button
                              type="button"
                              className="dealer-approve-button"
                              disabled={
                                approvingRequestId !==
                                null
                              }
                              onClick={() =>
                                handleApproveRequest(
                                  request
                                )
                              }
                            >
                              {String(
                                approvingRequestId
                              ) ===
                                String(
                                  request.transactionId
                                )
                                ? "승인 중..."
                                : "승인"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dealer-car-panel">
          <div className="dealer-car-panel-header">
            <div>
              <h3>판매 매물 목록</h3>

              <p>
                일반 판매 차량의 상세 조회,
                상태 변경, 삭제를 처리합니다.
              </p>
            </div>

            <div className="dealer-car-filter-box">
              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="차량명, 제조사, 모델명 검색"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={handleResetFilter}
              >
                초기화
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="dealer-car-error">
              {errorMessage}
            </p>
          )}

          <div className="dealer-car-count">
            총 {filteredCars.length}개의
            매물이 있습니다.
          </div>

          <div className="dealer-car-table-wrap">
            <table className="dealer-car-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>연식 / 주행거리</th>
                  <th>판매 가격</th>
                  <th>거래 방식</th>
                  <th>등록일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      매물을 불러오는
                      중입니다.
                    </td>
                  </tr>
                ) : filteredCars.length ===
                  0 ? (
                  <tr>
                    <td colSpan="7">
                      조건에 맞는 등록 매물이
                      없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredCars.map((car) => {
                    const isProcessing =
                      String(
                        processingCarId
                      ) === String(car.id);

                    return (
                      <tr key={car.id}>
                        <td>
                          <strong>
                            <Link
                              to={`/cars/${car.id}`}
                            >
                              {car.carName}
                            </Link>
                          </strong>

                          <span>
                            {car.region || "-"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {car.year || "-"}년식
                          </strong>

                          <span>
                            {Number(
                              car.mileage || 0
                            ).toLocaleString()}
                            km
                          </span>
                        </td>

                        <td>
                          <strong>
                            {Number(
                              car.price || 0
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

                          <span>등록일</span>
                        </td>

                        <td>
                          <span
                            className={`dealer-status ${car.status}`}
                          >
                            {car.status}
                          </span>
                        </td>

                        <td>
                          <div className="dealer-table-actions">
                            <Link
                              to={`/cars/${car.id}`}
                            >
                              상세
                            </Link>

                            {car.status !==
                              "판매중" &&
                              car.status !==
                              "판매완료" && (
                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleChangeStatus(
                                      car.id,
                                      "판매중"
                                    )
                                  }
                                >
                                  판매
                                </button>
                              )}

                            <button
                              type="button"
                              disabled={
                                isProcessing
                              }
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
                  })
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
