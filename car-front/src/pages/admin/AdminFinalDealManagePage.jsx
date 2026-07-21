import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

const FINAL_DEALS_KEY =
  "car_front_final_deals";

const AUCTION_WINNERS_KEY =
  "car_front_auction_winners";

const FINAL_DEAL_CHANGE_EVENT =
  "final-deal-change";

const FINAL_DEAL_EVENT_SOURCE =
  "admin-final-deal-manage";

function readStorageArray(
  storageKey
) {
  try {
    const savedValue =
      localStorage.getItem(
        storageKey
      );

    if (!savedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(savedValue);

    return Array.isArray(
      parsedValue
    )
      ? parsedValue
      : [];
  } catch (error) {
    console.error(
      `${storageKey} 데이터 불러오기 실패:`,
      error
    );

    localStorage.removeItem(
      storageKey
    );

    return [];
  }
}

function getFinalDeals() {
  return readStorageArray(
    FINAL_DEALS_KEY
  );
}

function getAuctionWinners() {
  return readStorageArray(
    AUCTION_WINNERS_KEY
  );
}

function saveFinalDeals(
  deals
) {
  localStorage.setItem(
    FINAL_DEALS_KEY,
    JSON.stringify(deals)
  );

  window.dispatchEvent(
    new CustomEvent(
      FINAL_DEAL_CHANGE_EVENT,
      {
        detail: {
          source:
            FINAL_DEAL_EVENT_SOURCE,
        },
      }
    )
  );
}

function formatDateTime(
  dateText
) {
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

function makeDealFromWinner(
  winner
) {
  const winningPrice =
    Number(
      winner.bidPrice || 0
    );

  const feeRate = 3;

  const feePrice =
    Math.floor(
      winningPrice *
        (feeRate / 100)
    );

  const totalPrice =
    winningPrice +
    feePrice;

  return {
    id: `winner-${winner.id}`,
    winnerId: winner.id,

    auctionId:
      winner.auctionId,

    carId:
      winner.carId,

    carName:
      winner.carName,

    buyerType:
      winner.bidderType,

    buyerId:
      winner.bidderId,

    buyerName:
      winner.bidderName,

    sellerType:
      winner.sellerType,

    sellerId:
      winner.sellerId,

    sellerName:
      winner.sellerName,

    winningPrice,
    feeRate,
    feePrice,
    totalPrice,

    status: "결제대기",

    createdAt:
      winner.createdAt,

    updatedAt:
      winner.createdAt,
  };
}

function createMergedFinalDeals() {
  const savedDeals =
    getFinalDeals();

  const winners =
    getAuctionWinners();

  return winners.map(
    (winner) => {
      const savedDeal =
        savedDeals.find(
          (deal) =>
            String(
              deal.winnerId
            ) ===
            String(
              winner.id
            )
        );

      return (
        savedDeal ||
        makeDealFromWinner(
          winner
        )
      );
    }
  );
}

function AdminFinalDealManagePage() {
  /*
   * 처음 렌더링할 때 localStorage를
   * 바로 읽어서 초기 상태를 만듭니다.
   *
   * 기존처럼 useEffect 안에서
   * loadFinalDeals를 호출하지 않으므로
   * 추가 렌더링이 발생하지 않습니다.
   */
  const [
    finalDeals,
    setFinalDeals,
  ] = useState(
    createMergedFinalDeals
  );

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("전체");

  const [
    selectedDeal,
    setSelectedDeal,
  ] = useState(null);

  /*
   * 다른 컴포넌트나 브라우저 탭에서
   * 최종 거래 데이터가 변경된 경우만
   * 다시 localStorage를 읽습니다.
   */
  useEffect(() => {
    function handleFinalDealChange(
      event
    ) {
      if (
        event.detail?.source ===
        FINAL_DEAL_EVENT_SOURCE
      ) {
        return;
      }

      setFinalDeals(
        createMergedFinalDeals()
      );
    }

    function handleStorageChange(
      event
    ) {
      if (
        event.key !==
          FINAL_DEALS_KEY &&
        event.key !==
          AUCTION_WINNERS_KEY
      ) {
        return;
      }

      setFinalDeals(
        createMergedFinalDeals()
      );
    }

    window.addEventListener(
      FINAL_DEAL_CHANGE_EVENT,
      handleFinalDealChange
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        FINAL_DEAL_CHANGE_EVENT,
        handleFinalDealChange
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  function handleResetFilter() {
    setSearchText("");
    setStatusFilter("전체");
  }

  function handleOpenDetail(
    deal
  ) {
    setSelectedDeal(deal);
  }

  function handleCloseDetail() {
    setSelectedDeal(null);
  }

  function handleChangeDealStatus(
    status
  ) {
    if (!selectedDeal) {
      return;
    }

    const updatedAt =
      new Date().toISOString();

    const nextDeals =
      finalDeals.map(
        (deal) =>
          String(
            deal.winnerId
          ) ===
          String(
            selectedDeal.winnerId
          )
            ? {
                ...deal,
                status,
                updatedAt,
              }
            : deal
      );

    /*
     * 현재 컴포넌트는 직접 상태를
     * 변경합니다.
     */
    setFinalDeals(
      nextDeals
    );

    setSelectedDeal(
      (prevDeal) => {
        if (!prevDeal) {
          return null;
        }

        return {
          ...prevDeal,
          status,
          updatedAt,
        };
      }
    );

    /*
     * 저장 후 다른 컴포넌트가
     * 변경사항을 확인하도록 이벤트를
     * 발생시킵니다.
     */
    saveFinalDeals(
      nextDeals
    );
  }

  const filteredDeals =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      return finalDeals.filter(
        (deal) => {
          const keywordMatch =
            keyword === "" ||
            String(
              deal.carName || ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              deal.buyerName || ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              deal.sellerName || ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            String(
              deal.carId || ""
            ).includes(
              keyword
            );

          const statusMatch =
            statusFilter ===
              "전체" ||
            deal.status ===
              statusFilter;

          return (
            keywordMatch &&
            statusMatch
          );
        }
      );
    }, [
      finalDeals,
      searchText,
      statusFilter,
    ]);

  const summary =
    useMemo(() => {
      const totalWinningPrice =
        filteredDeals.reduce(
          (
            sum,
            deal
          ) =>
            sum +
            Number(
              deal.winningPrice ||
                0
            ),
          0
        );

      const totalFeePrice =
        filteredDeals.reduce(
          (
            sum,
            deal
          ) =>
            sum +
            Number(
              deal.feePrice ||
                0
            ),
          0
        );

      const waitingCount =
        filteredDeals.filter(
          (deal) =>
            deal.status ===
            "결제대기"
        ).length;

      const doneCount =
        filteredDeals.filter(
          (deal) =>
            deal.status ===
            "결제완료"
        ).length;

      return {
        totalWinningPrice,
        totalFeePrice,
        waitingCount,
        doneCount,
      };
    }, [filteredDeals]);

  const columns = [
    {
      key: "carName",
      label: "차량명",

      render: (deal) => (
        <Link
          to={`/cars/${deal.carId}`}
          className="admin-post-link"
        >
          {deal.carName}
        </Link>
      ),
    },
    {
      key: "buyerName",
      label: "구매자",
    },
    {
      key: "sellerName",
      label: "판매자",
    },
    {
      key: "winningPrice",
      label: "낙찰가",

      render: (deal) =>
        `${Number(
          deal.winningPrice ||
            0
        ).toLocaleString()}만원`,
    },
    {
      key: "feePrice",
      label: "수수료",

      render: (deal) =>
        `${Number(
          deal.feePrice || 0
        ).toLocaleString()}만원`,
    },
    {
      key: "totalPrice",
      label: "총액",

      render: (deal) =>
        `${Number(
          deal.totalPrice || 0
        ).toLocaleString()}만원`,
    },
    {
      key: "status",
      label: "거래상태",

      render: (deal) => (
        <span
          className={`manage-badge ${deal.status}`}
        >
          {deal.status}
        </span>
      ),
    },
    {
      key: "manage",
      label: "관리",

      render: (
        deal,
        onRowAction
      ) => (
        <button
          type="button"
          className="small-btn"
          onClick={() =>
            onRowAction?.(
              deal
            )
          }
        >
          상세
        </button>
      ),
    },
  ];

  const filters = [
    {
      name: "status",
      value: statusFilter,
      onChange:
        setStatusFilter,

      options: [
        {
          label: "전체 상태",
          value: "전체",
        },
        {
          label: "결제대기",
          value: "결제대기",
        },
        {
          label: "결제완료",
          value: "결제완료",
        },
        {
          label: "거래취소",
          value: "거래취소",
        },
      ],
    },
  ];

  return (
    <AdminLayout
      title="최종 거래 관리"
      description="경매 낙찰 이후 생성된 최종 거래, 수수료, 결제 상태를 관리합니다."
    >
      <section className="admin-summary-mini-grid">
        <article className="admin-summary-mini-card">
          <span>
            조회 거래
          </span>

          <strong>
            {filteredDeals.length}건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>
            결제대기
          </span>

          <strong>
            {summary.waitingCount}건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>
            결제완료
          </span>

          <strong>
            {summary.doneCount}건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>
            예상 수수료
          </span>

          <strong>
            {summary.totalFeePrice.toLocaleString()}
            만원
          </strong>
        </article>
      </section>

      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>
              최종 거래 목록
            </h3>

            <p className="admin-panel-sub-text">
              지금은 localStorage에
              저장된 낙찰/거래 데이터를
              기준으로 출력합니다.
            </p>
          </div>
        </div>

        <AdminSearchFilter
          searchValue={
            searchText
          }
          onSearchChange={
            setSearchText
          }
          searchPlaceholder="차량명, 구매자, 판매자 검색"
          filters={filters}
          onReset={
            handleResetFilter
          }
        />

        <AdminTable
          columns={columns}
          data={filteredDeals}
          totalCount={
            filteredDeals.length
          }
          emptyMessage="조회된 최종 거래가 없습니다."
          onRowAction={
            handleOpenDetail
          }
        />
      </section>

      {selectedDeal && (
        <AdminModal
          title="최종 거래 상세"
          onClose={
            handleCloseDetail
          }
        >
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>
                차량명
              </span>

              <strong>
                {
                  selectedDeal.carName
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                구매자
              </span>

              <strong>
                {
                  selectedDeal.buyerName
                }{" "}
                /{" "}
                {
                  selectedDeal.buyerType
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                판매자
              </span>

              <strong>
                {
                  selectedDeal.sellerName
                }{" "}
                /{" "}
                {
                  selectedDeal.sellerType
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                낙찰가
              </span>

              <strong>
                {Number(
                  selectedDeal.winningPrice ||
                    0
                ).toLocaleString()}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                수수료율
              </span>

              <strong>
                {
                  selectedDeal.feeRate
                }
                %
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                수수료
              </span>

              <strong>
                {Number(
                  selectedDeal.feePrice ||
                    0
                ).toLocaleString()}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                총 결제 금액
              </span>

              <strong>
                {Number(
                  selectedDeal.totalPrice ||
                    0
                ).toLocaleString()}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                거래상태
              </span>

              <strong>
                <span
                  className={`manage-badge ${selectedDeal.status}`}
                >
                  {
                    selectedDeal.status
                  }
                </span>
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                거래 생성일
              </span>

              <strong>
                {formatDateTime(
                  selectedDeal.createdAt
                )}
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                최근 수정일
              </span>

              <strong>
                {formatDateTime(
                  selectedDeal.updatedAt
                )}
              </strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn wait"
              onClick={() =>
                handleChangeDealStatus(
                  "결제대기"
                )
              }
            >
              결제대기
            </button>

            <button
              type="button"
              className="status-btn approve"
              onClick={() =>
                handleChangeDealStatus(
                  "결제완료"
                )
              }
            >
              결제완료
            </button>

            <button
              type="button"
              className="status-btn stop"
              onClick={() =>
                handleChangeDealStatus(
                  "거래취소"
                )
              }
            >
              거래취소
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <Link
              to={`/cars/${selectedDeal.carId}`}
              className="modal-sub-link-btn"
            >
              차량 상세보기
            </Link>

            <button
              type="button"
              className="modal-main-btn"
              onClick={
                handleCloseDetail
              }
            >
              확인
            </button>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminFinalDealManagePage;