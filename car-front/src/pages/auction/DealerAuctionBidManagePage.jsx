import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  getMyAuctionBids,
} from "../../api/auctionApi";
import "../../css/auction/dealerAuctionBidManagePage.css";

function formatDateTime(dateText) {
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

function normalizeStatus(status) {
  return String(
    status || ""
  ).toUpperCase();
}

function getBidResultText(bid) {
  if (bid.winner) {
    return "낙찰";
  }

  const status =
    normalizeStatus(
      bid.auctionStatus
    );

  if (
    [
      "COMPLETED",
      "ENDED",
      "CLOSED",
      "SOLD",
      "FAILED",
      "경매종료",
      "낙찰완료",
      "유찰",
    ].includes(status)
  ) {
    return "미낙찰";
  }

  return "입찰중";
}

function getStatusClassName(bid) {
  const result =
    getBidResultText(bid);

  if (result === "낙찰") {
    return "낙찰완료";
  }

  if (result === "미낙찰") {
    return "미낙찰";
  }

  return "입찰완료";
}

function DealerAuctionBidManagePage() {
  const { carId } =
    useParams();

  const [
    bidList,
    setBidList,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadMyBids =
    useCallback(async ({
      showRefreshing = false,
    } = {}) => {
      try {
        if (showRefreshing) {
          setIsRefreshing(true);
        }

        setErrorMessage("");

        const result =
          await getMyAuctionBids();

        setBidList(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (error) {
        console.error(
          "딜러 입찰 내역 조회 실패:",
          error
        );

        setBidList([]);

        setErrorMessage(
          error?.message ||
          "입찰 내역을 불러오지 못했습니다."
        );
      } finally {
        if (showRefreshing) {
          setIsRefreshing(false);
        }
      }
    }, []);

  useEffect(() => {
    let isCancelled = false;

    getMyAuctionBids()
      .then((result) => {
        if (isCancelled) {
          return;
        }

        setBidList(
          Array.isArray(result)
            ? result
            : []
        );

        setErrorMessage("");
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "딜러 입찰 내역 조회 실패:",
          error
        );

        setBidList([]);

        setErrorMessage(
          error?.message ||
          "입찰 내역을 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredBids =
    useMemo(() => {
      const targetCarId =
        Number(carId);

      const source =
        Number.isFinite(
          targetCarId
        )
          ? bidList.filter(
            (bid) =>
              Number(
                bid.carId
              ) ===
              targetCarId
          )
          : bidList;

      return [...source].sort(
        (firstBid, secondBid) => {
          const firstTime =
            new Date(
              firstBid.bidCreatedAt ||
              0
            ).getTime();

          const secondTime =
            new Date(
              secondBid.bidCreatedAt ||
              0
            ).getTime();

          return (
            secondTime -
            firstTime
          );
        }
      );
    }, [
      bidList,
      carId,
    ]);

  const summary =
    useMemo(() => {
      return filteredBids.reduce(
        (result, bid) => {
          result.total += 1;

          const bidResult =
            getBidResultText(bid);

          if (
            bidResult ===
            "낙찰"
          ) {
            result.winner += 1;
          } else if (
            bidResult ===
            "미낙찰"
          ) {
            result.failed += 1;
          } else {
            result.active += 1;
          }

          return result;
        },
        {
          total: 0,
          active: 0,
          winner: 0,
          failed: 0,
        }
      );
    }, [filteredBids]);

  const selectedCarName =
    carId &&
      filteredBids[0]?.carName
      ? filteredBids[0]
        .carName
      : null;

  function handleRefresh() {
    loadMyBids({
      showRefreshing: true,
    });
  }

  if (isLoading) {
    return (
      <main className="auction-bid-manage-page">
        <div className="auction-bid-container">
          <section className="auction-bid-panel">
            <div className="auction-empty-message">
              내 입찰 내역을 불러오는 중입니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="auction-bid-manage-page">
      <div className="auction-bid-container">
        <section className="auction-bid-header">
          <div>
            <p className="auction-page-label">
              MY AUCTION BIDS
            </p>

            <h2>
              내 입찰 내역
            </h2>

            <p>
              {selectedCarName
                ? `${selectedCarName} 차량에 제출한 입찰 정보입니다.`
                : "내가 참여한 경매와 입찰 결과를 확인합니다."}
            </p>
          </div>

          <div>
            {carId && (
              <Link
                to="/dealer/bids"
                className="auction-primary-link"
              >
                전체 입찰 보기
              </Link>
            )}

            {!carId && (
              <Link
                to="/"
                className="auction-primary-link"
              >
                경매 차량 보기
              </Link>
            )}
          </div>
        </section>

        <section className="auction-bid-summary-grid">
          <article>
            <span>
              전체 입찰
            </span>

            <strong>
              {summary.total}
            </strong>

            <em>건</em>
          </article>

          <article>
            <span>
              진행 중
            </span>

            <strong>
              {summary.active}
            </strong>

            <em>건</em>
          </article>

          <article>
            <span>
              낙찰
            </span>

            <strong>
              {summary.winner}
            </strong>

            <em>건</em>
          </article>

          <article>
            <span>
              미낙찰
            </span>

            <strong>
              {summary.failed}
            </strong>

            <em>건</em>
          </article>
        </section>

        <section className="auction-bid-panel">
          <div className="auction-bid-panel-header">
            <div>
              <h3>
                입찰 목록
              </h3>

              <p>
                다른 딜러의 입찰 금액은 표시되지 않으며,
                본인이 제출한 입찰과 경매 결과만 조회됩니다.
              </p>
            </div>

            <button
              type="button"
              className="auction-action-btn"
              onClick={
                handleRefresh
              }
              disabled={
                isRefreshing
              }
            >
              {isRefreshing
                ? "새로고침 중"
                : "새로고침"}
            </button>
          </div>

          {errorMessage && (
            <section className="auction-guide-box">
              <h3>
                조회 실패
              </h3>

              <p>
                {errorMessage}
              </p>
            </section>
          )}

          <div className="auction-bid-table-wrap">
            <table className="auction-bid-table">
              <thead>
                <tr>
                  <th>
                    차량
                  </th>

                  <th>
                    내 입찰 금액
                  </th>

                  <th>
                    입찰 시간
                  </th>

                  <th>
                    경매 기간
                  </th>

                  <th>
                    경매 상태
                  </th>

                  <th>
                    결과
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredBids.length >
                  0 ? (
                  filteredBids.map(
                    (bid) => {
                      const resultText =
                        getBidResultText(
                          bid
                        );

                      return (
                        <tr
                          key={
                            bid.bidId
                          }
                        >
                          <td>
                            <Link
                              to={`/cars/${bid.carId}`}
                            >
                              <strong>
                                {bid.carName ||
                                  `차량 ${bid.carId}`}
                              </strong>
                            </Link>

                            <span>
                              경매 ID:{" "}
                              {bid.auctionId}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {Number(
                                bid.bidAmount ||
                                0
                              ).toLocaleString()}
                              만원
                            </strong>

                            {bid.winningBidAmount !=
                              null && (
                                <span>
                                  최종 낙찰가:{" "}
                                  {Number(
                                    bid.winningBidAmount
                                  ).toLocaleString()}
                                  만원
                                </span>
                              )}
                          </td>

                          <td>
                            <strong>
                              {formatDateTime(
                                bid.bidCreatedAt
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {formatDateTime(
                                bid.auctionStartTime
                              )}
                            </strong>

                            <span>
                              ~{" "}
                              {formatDateTime(
                                bid.auctionEndTime
                              )}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {bid.auctionStatus ||
                                "-"}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`auction-bid-status ${getStatusClassName(
                                bid
                              )}`}
                            >
                              {resultText}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="auction-empty-message"
                    >
                      {carId
                        ? "이 차량에 제출한 입찰 내역이 없습니다."
                        : "아직 참여한 경매가 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="auction-guide-box">
          <h3>
            입찰 결과 안내
          </h3>

          <p>
            경매 진행 중에는 본인의 입찰 금액만 확인할 수 있습니다.
            경매 마감 후 최고 입찰자로 선정되면 낙찰로 표시되며,
            그 외 입찰은 미낙찰로 표시됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

export default DealerAuctionBidManagePage;