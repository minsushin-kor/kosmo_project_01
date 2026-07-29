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
  getCarDetail,
} from "../../api/carApi";
import {
  closeAuction,
  getSellerAuctionBids,
} from "../../api/auctionApi";
import "../../css/member/memberAuctionBidsPage.css";

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

function normalizeAuctionStatus(
  status
) {
  return String(
    status || ""
  ).toUpperCase();
}

function isCompletedStatus(
  status
) {
  return [
    "COMPLETED",
    "ENDED",
    "CLOSED",
    "SOLD",
    "경매종료",
    "낙찰완료",
  ].includes(
    normalizeAuctionStatus(
      status
    )
  );
}

function MemberAuctionBidsPage() {
  const { carId } =
    useParams();

  const [
    car,
    setCar,
  ] = useState(null);

  const [
    bids,
    setBids,
  ] = useState([]);

  const [
    closeResult,
    setCloseResult,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isClosing,
    setIsClosing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const loadAuctionData =
    useCallback(async ({
      showLoading = false,
    } = {}) => {
      if (!carId) {
        setErrorMessage(
          "차량 ID를 확인할 수 없습니다."
        );

        if (showLoading) {
          setIsLoading(false);
        }

        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }

        setErrorMessage("");

        const [
          carResult,
          bidResult,
        ] = await Promise.all([
          getCarDetail(carId),
          getSellerAuctionBids(
            carId
          ),
        ]);

        setCar(carResult);

        setBids(
          Array.isArray(
            bidResult
          )
            ? bidResult
            : []
        );
      } catch (error) {
        console.error(
          "판매 차량 입찰 내역 조회 실패:",
          error
        );

        setCar(null);
        setBids([]);

        setErrorMessage(
          error?.message ||
          "입찰 내역을 불러오지 못했습니다."
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    }, [carId]);

  useEffect(() => {
    let isCancelled = false;

    if (!carId) {
      queueMicrotask(() => {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          "차량 ID를 확인할 수 없습니다."
        );

        setIsLoading(false);
      });

      return () => {
        isCancelled = true;
      };
    }

    Promise.all([
      getCarDetail(carId),
      getSellerAuctionBids(
        carId
      ),
    ])
      .then(
        ([
          carResult,
          bidResult,
        ]) => {
          if (isCancelled) {
            return;
          }

          setCar(carResult);

          setBids(
            Array.isArray(
              bidResult
            )
              ? bidResult
              : []
          );

          setErrorMessage("");
        }
      )
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "판매 차량 입찰 내역 조회 실패:",
          error
        );

        setCar(null);
        setBids([]);

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
  }, [carId]);

  function handleRefresh() {
    loadAuctionData({
      showLoading: false,
    });
  }

  const sortedBids =
    useMemo(() => {
      return [...bids].sort(
        (firstBid, secondBid) => {
          const amountDiff =
            Number(
              secondBid.bidAmount ||
              0
            ) -
            Number(
              firstBid.bidAmount ||
              0
            );

          if (amountDiff !== 0) {
            return amountDiff;
          }

          return (
            Number(
              firstBid.bidId ||
              0
            ) -
            Number(
              secondBid.bidId ||
              0
            )
          );
        }
      );
    }, [bids]);

  const highestBid =
    sortedBids[0] ||
    null;

  const auction =
    car?.auction ||
    null;

  const auctionId =
    auction?.auctionId ||
    car?.auctionId ||
    bids[0]?.auctionId ||
    null;

  const auctionStatus =
    closeResult?.status ||
    auction?.status ||
    car?.auctionStatus ||
    car?.status ||
    "ACTIVE";

  const isAuctionClosed =
    Boolean(closeResult) ||
    isCompletedStatus(
      auctionStatus
    );

  const carName =
    car?.carName ||
    [
      car?.make ||
      car?.brand,
      car?.model ||
      car?.modelName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "판매 차량";

  const startPrice =
    Number(
      auction?.startPrice ??
      car?.startPrice ??
      car?.price ??
      0
    );

  const endTime =
    closeResult?.endTime ||
    auction?.endTime ||
    auction?.endDate ||
    car?.endTime ||
    car?.endDate ||
    null;

  const winningBid =
    closeResult?.winningBid ||
    null;

  async function handleCloseAuction() {
    if (
      isClosing ||
      isAuctionClosed
    ) {
      return;
    }

    if (!auctionId) {
      setActionMessage(
        "경매 ID를 확인할 수 없습니다."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "경매를 마감하면 최고 입찰자가 자동 낙찰됩니다. 계속하시겠습니까?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsClosing(true);
      setActionMessage(
        "경매를 마감하고 있습니다."
      );

      const result =
        await closeAuction(
          auctionId
        );

      setCloseResult(result);

      if (
        result?.winningBid
      ) {
        setActionMessage(
          `${result.winningBid.dealerName || "딜러"}님이 ${Number(
            result.winningBid.bidAmount || 0
          ).toLocaleString()}만원으로 낙찰되었습니다.`
        );
      } else {
        setActionMessage(
          "입찰자가 없어 유찰 처리되었습니다."
        );
      }

      await loadAuctionData({
        showLoading: false,
      });
    } catch (error) {
      console.error(
        "경매 마감 실패:",
        error
      );

      setActionMessage(
        error?.message ||
        "경매 마감 중 오류가 발생했습니다."
      );
    } finally {
      setIsClosing(false);
    }
  }

  if (isLoading) {
    return (
      <main className="member-auction-bids-page">
        <div className="member-auction-bids-container">
          <section className="member-auction-panel">
            <div className="member-auction-empty">
              입찰 내역을 불러오는 중입니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="member-auction-bids-page">
        <div className="member-auction-bids-container">
          <section className="member-auction-bids-header">
            <div>
              <p className="page-label">
                MY AUCTION
              </p>

              <h2>
                판매 차량 입찰 관리
              </h2>

              <p>
                {errorMessage}
              </p>
            </div>

            <Link
              to="/member"
              className="member-auction-primary-link"
            >
              마이페이지
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="member-auction-bids-page">
      <div className="member-auction-bids-container">
        <section className="member-auction-bids-header">
          <div>
            <p className="page-label">
              MY AUCTION
            </p>

            <h2>
              판매 차량 입찰 관리
            </h2>

            <p>
              {carName}에 들어온 입찰을 확인하고
              경매를 마감합니다.
            </p>
          </div>

          <Link
            to={`/cars/${carId}`}
            className="member-auction-primary-link"
          >
            차량 상세보기
          </Link>
        </section>

        <section className="member-auction-summary-grid">
          <article>
            <span>
              전체 입찰
            </span>

            <strong>
              {bids.length}
            </strong>

            <em>건</em>
          </article>

          <article>
            <span>
              경매 시작가
            </span>

            <strong>
              {startPrice.toLocaleString()}
            </strong>

            <em>만원</em>
          </article>

          <article>
            <span>
              현재 최고가
            </span>

            <strong>
              {Number(
                highestBid?.bidAmount ||
                0
              ).toLocaleString()}
            </strong>

            <em>만원</em>
          </article>

          <article>
            <span>
              경매 상태
            </span>

            <strong>
              {isAuctionClosed
                ? "마감"
                : "진행중"}
            </strong>
          </article>
        </section>

        <section className="member-auction-panel">
          <div className="member-auction-panel-header">
            <div>
              <h3>
                입찰 내역
              </h3>

              <p>
                판매자 본인만 전체 입찰 금액을 확인할 수 있습니다.
                최고 입찰가가 먼저 표시됩니다.
              </p>
            </div>

            <div className="member-auction-actions">
              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  isClosing
                }
              >
                새로고침
              </button>

              <button
                type="button"
                onClick={
                  handleCloseAuction
                }
                disabled={
                  isClosing ||
                  isAuctionClosed
                }
              >
                {isClosing
                  ? "마감 처리 중"
                  : isAuctionClosed
                    ? "경매 마감됨"
                    : "경매 마감"}
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="member-auction-guide-box">
              <p>
                {actionMessage}
              </p>
            </div>
          )}

          {winningBid && (
            <div className="member-auction-guide-box">
              <h3>
                최종 낙찰 결과
              </h3>

              <p>
                낙찰 딜러:{" "}
                <strong>
                  {winningBid.dealerName ||
                    "-"}
                </strong>
                <br />

                낙찰 금액:{" "}
                <strong>
                  {Number(
                    winningBid.bidAmount ||
                    0
                  ).toLocaleString()}
                  만원
                </strong>
                <br />

                마감 시각:{" "}
                <strong>
                  {formatDateTime(
                    closeResult?.endTime
                  )}
                </strong>
              </p>
            </div>
          )}

          <div className="member-auction-table-wrap">
            <table className="member-auction-table">
              <thead>
                <tr>
                  <th>
                    순위
                  </th>

                  <th>
                    딜러
                  </th>

                  <th>
                    입찰 금액
                  </th>

                  <th>
                    입찰 시간
                  </th>

                  <th>
                    상태
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedBids.length >
                0 ? (
                  sortedBids.map(
                    (
                      bid,
                      index
                    ) => {
                      const isWinner =
                        Number(
                          winningBid?.bidId
                        ) ===
                        Number(
                          bid.bidId
                        );

                      return (
                        <tr
                          key={
                            bid.bidId
                          }
                        >
                          <td>
                            <strong>
                              {index + 1}위
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {bid.dealerName ||
                                `딜러 ${bid.dealerId}`}
                            </strong>

                            <span>
                              딜러 ID:{" "}
                              {bid.dealerId}
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
                          </td>

                          <td>
                            <strong>
                              {formatDateTime(
                                bid.createdAt
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`member-bid-status ${
                                isWinner
                                  ? "낙찰"
                                  : isAuctionClosed
                                    ? "미낙찰"
                                    : "진행중"
                              }`}
                            >
                              {isWinner
                                ? "낙찰"
                                : isAuctionClosed
                                  ? "미낙찰"
                                  : index === 0
                                    ? "현재 최고가"
                                    : "입찰완료"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="member-auction-empty"
                    >
                      아직 등록된 입찰이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="member-auction-guide-box">
          <h3>
            경매 마감 안내
          </h3>

          <p>
            경매를 마감하면 서버가 가장 높은 금액을 제시한 딜러를
            자동으로 낙찰자로 선정합니다. 같은 금액이면 먼저 입찰한
            딜러가 우선됩니다. 입찰자가 없으면 차량은 유찰 처리됩니다.
            현재 마감 예정 시각은 {formatDateTime(endTime)}입니다.
          </p>
        </section>
      </div>
    </main>
  );
}

export default MemberAuctionBidsPage;
