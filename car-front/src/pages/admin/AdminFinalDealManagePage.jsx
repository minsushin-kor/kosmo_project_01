import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import {
  getAdminTransactions,
  updateTransactionStatus,
} from "../../api/transactionApi";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

const STATUS_LABEL_MAP = {
  PENDING_PAYMENT: "결제대기",
  PAID: "결제완료",
  COMPLETED: "거래완료",
  CANCELLED: "거래취소",
};

const STATUS_VALUE_MAP = {
  결제대기: "PENDING_PAYMENT",
  결제완료: "PAID",
  거래완료: "COMPLETED",
  거래취소: "CANCELLED",
};

function formatDateTime(dateText) {
  if (!dateText) {
    return "-";
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatParticipant(type, id) {
  const normalizedType = String(
    type || ""
  ).toUpperCase();

  let typeLabel = normalizedType || "사용자";

  if (normalizedType === "MEMBER") {
    typeLabel = "일반회원";
  }

  if (normalizedType === "DEALER") {
    typeLabel = "딜러";
  }

  if (normalizedType === "COMPANY") {
    typeLabel = "회사";
  }

  return `${typeLabel} #${id ?? "-"}`;
}

function normalizeCommissionRate(rate) {
  const numberRate = Number(rate || 0);

  if (!Number.isFinite(numberRate)) {
    return 0;
  }

  return numberRate <= 1
    ? numberRate * 100
    : numberRate;
}

function normalizeTransaction(transaction) {
  const dealPrice = Number(
    transaction.dealPrice || 0
  );

  const commissionAmount = Number(
    transaction.commissionAmount || 0
  );

  const status = String(
    transaction.status || "PENDING_PAYMENT"
  ).toUpperCase();

  const carName =
    [
      transaction.carMake,
      transaction.carModel,
    ]
      .filter(Boolean)
      .join(" ") ||
    `차량 #${transaction.carId ?? "-"}`;

  return {
    ...transaction,

    id: transaction.transactionId,

    carName,

    buyerName: formatParticipant(
      transaction.buyerType,
      transaction.buyerId
    ),

    sellerName: formatParticipant(
      transaction.sellerType,
      transaction.sellerId
    ),

    winningPrice: dealPrice,

    feeRate: normalizeCommissionRate(
      transaction.commissionRate
    ),

    feePrice: commissionAmount,

    totalPrice:
      dealPrice + commissionAmount,

    statusCode: status,

    status:
      STATUS_LABEL_MAP[status] ||
      status,

    updatedAt:
      transaction.cancelledAt ||
      transaction.completedAt ||
      transaction.paidAt ||
      transaction.createdAt,
  };
}

function AdminFinalDealManagePage() {
  const [finalDeals, setFinalDeals] =
    useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("전체");

  const [selectedDeal, setSelectedDeal] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadFinalDeals = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const transactions =
          await getAdminTransactions();

        const normalizedDeals =
          transactions.map(
            normalizeTransaction
          );

        setFinalDeals(
          normalizedDeals
        );
      } catch (error) {
        console.error(
          "관리자 거래 목록 조회 실패:",
          error
        );

        setErrorMessage(
          error.message ||
          "최종 거래 목록을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
  let isActive = true;

  getAdminTransactions()
    .then((transactions) => {
      if (!isActive) {
        return;
      }

      setFinalDeals(
        transactions.map(
          normalizeTransaction
        )
      );
    })
    .catch((error) => {
      if (!isActive) {
        return;
      }

      console.error(
        "관리자 거래 목록 조회 실패:",
        error
      );

      setErrorMessage(
        error.message ||
          "최종 거래 목록을 불러오지 못했습니다."
      );
    })
    .finally(() => {
      if (!isActive) {
        return;
      }

      setIsLoading(false);
    });

  return () => {
    isActive = false;
  };
}, []);

  function handleResetFilter() {
    setSearchText("");
    setStatusFilter("전체");
  }

  function handleOpenDetail(deal) {
    setSelectedDeal(deal);
  }

  function handleCloseDetail() {
    if (isUpdating) {
      return;
    }

    setSelectedDeal(null);
  }

  async function handleChangeDealStatus(
    statusLabel
  ) {
    if (
      !selectedDeal ||
      isUpdating
    ) {
      return;
    }

    const statusCode =
      STATUS_VALUE_MAP[statusLabel];

    if (!statusCode) {
      return;
    }

    if (
      selectedDeal.statusCode ===
      statusCode
    ) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");

    try {
      const updatedTransaction =
        await updateTransactionStatus(
          selectedDeal.transactionId,
          statusCode
        );

      const normalizedDeal =
        normalizeTransaction(
          updatedTransaction
        );

      setFinalDeals(
        (currentDeals) =>
          currentDeals.map(
            (deal) =>
              deal.transactionId ===
                normalizedDeal.transactionId
                ? normalizedDeal
                : deal
          )
      );

      setSelectedDeal(
        normalizedDeal
      );
    } catch (error) {
      console.error(
        "관리자 거래 상태 변경 실패:",
        error
      );

      const message =
        error.message ||
        "거래 상태를 변경하지 못했습니다.";

      setErrorMessage(message);

      window.alert(message);
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredDeals = useMemo(() => {
    const keyword = searchText
      .trim()
      .toLowerCase();

    return finalDeals.filter(
      (deal) => {
        const keywordMatch =
          keyword === "" ||
          deal.carName
            .toLowerCase()
            .includes(keyword) ||
          deal.buyerName
            .toLowerCase()
            .includes(keyword) ||
          deal.sellerName
            .toLowerCase()
            .includes(keyword) ||
          String(
            deal.carId || ""
          ).includes(keyword) ||
          String(
            deal.transactionId || ""
          ).includes(keyword);

        const statusMatch =
          statusFilter === "전체" ||
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

  const summary = useMemo(() => {
    const totalFeePrice =
      filteredDeals.reduce(
        (sum, deal) =>
          sum +
          Number(
            deal.feePrice || 0
          ),
        0
      );

    const waitingCount =
      filteredDeals.filter(
        (deal) =>
          deal.statusCode ===
          "PENDING_PAYMENT"
      ).length;

    const paidCount =
      filteredDeals.filter(
        (deal) =>
          deal.statusCode ===
          "PAID"
      ).length;

    const completedCount =
      filteredDeals.filter(
        (deal) =>
          deal.statusCode ===
          "COMPLETED"
      ).length;

    return {
      totalFeePrice,
      waitingCount,
      paidCount,
      completedCount,
    };
  }, [filteredDeals]);

  const columns = useMemo(
    () => [
      {
        key: "transactionId",
        label: "거래번호",
        render: (deal) =>
          `#${deal.transactionId}`,
      },
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
            deal.winningPrice || 0
          ).toLocaleString(
            "ko-KR"
          )}만원`,
      },
      {
        key: "feePrice",
        label: "수수료",
        render: (deal) =>
          `${Number(
            deal.feePrice || 0
          ).toLocaleString(
            "ko-KR"
          )}만원`,
      },
      {
        key: "totalPrice",
        label: "총액",
        render: (deal) =>
          `${Number(
            deal.totalPrice || 0
          ).toLocaleString(
            "ko-KR"
          )}만원`,
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
              onRowAction?.(deal)
            }
          >
            상세
          </button>
        ),
      },
    ],
    []
  );

  const filters = useMemo(
    () => [
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
            label: "거래완료",
            value: "거래완료",
          },
          {
            label: "거래취소",
            value: "거래취소",
          },
        ],
      },
    ],
    [statusFilter]
  );

  return (
    <AdminLayout
      title="최종 거래 관리"
      description="경매 낙찰 이후 생성된 최종 거래, 수수료, 결제 상태를 관리합니다."
    >
      <section className="admin-summary-mini-grid">
        <article className="admin-summary-mini-card">
          <span>조회 거래</span>
          <strong>
            {filteredDeals.length}건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>결제대기</span>
          <strong>
            {summary.waitingCount}건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>
            결제완료 / 거래완료
          </span>
          <strong>
            {summary.paidCount +
              summary.completedCount}
            건
          </strong>
        </article>

        <article className="admin-summary-mini-card">
          <span>예상 수수료</span>
          <strong>
            {summary.totalFeePrice.toLocaleString(
              "ko-KR"
            )}
            만원
          </strong>
        </article>
      </section>

      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>최종 거래 목록</h3>

            <p className="admin-panel-sub-text">
              거래 DB에 저장된 낙찰
              거래와 결제 상태를 기준으로
              출력합니다.
            </p>
          </div>

          <button
            type="button"
            className="small-btn"
            onClick={
              loadFinalDeals
            }
            disabled={isLoading}
          >
            {isLoading
              ? "조회 중"
              : "새로고침"}
          </button>
        </div>

        {errorMessage && (
          <p
            className="admin-panel-sub-text"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={
            setSearchText
          }
          searchPlaceholder="거래번호, 차량명, 구매자, 판매자 검색"
          filters={filters}
          onReset={
            handleResetFilter
          }
        />

        <AdminTable
          columns={columns}
          data={
            isLoading
              ? []
              : filteredDeals
          }
          totalCount={
            filteredDeals.length
          }
          emptyMessage={
            isLoading
              ? "최종 거래 목록을 불러오는 중입니다."
              : "조회된 최종 거래가 없습니다."
          }
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
              <span>거래번호</span>
              <strong>
                #
                {
                  selectedDeal.transactionId
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>차량명</span>
              <strong>
                {
                  selectedDeal.carName
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>구매자</span>
              <strong>
                {
                  selectedDeal.buyerName
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>판매자</span>
              <strong>
                {
                  selectedDeal.sellerName
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>낙찰가</span>
              <strong>
                {selectedDeal.winningPrice.toLocaleString(
                  "ko-KR"
                )}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>수수료율</span>
              <strong>
                {selectedDeal.feeRate.toLocaleString(
                  "ko-KR"
                )}
                %
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>수수료</span>
              <strong>
                {selectedDeal.feePrice.toLocaleString(
                  "ko-KR"
                )}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                총 결제 금액
              </span>
              <strong>
                {selectedDeal.totalPrice.toLocaleString(
                  "ko-KR"
                )}
                만원
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>거래상태</span>
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
                최근 변경일
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
              disabled={
                isUpdating ||
                selectedDeal.statusCode ===
                "PENDING_PAYMENT"
              }
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
              disabled={
                isUpdating ||
                selectedDeal.statusCode ===
                "PAID"
              }
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
              className="status-btn approve"
              disabled={
                isUpdating ||
                selectedDeal.statusCode ===
                "COMPLETED"
              }
              onClick={() =>
                handleChangeDealStatus(
                  "거래완료"
                )
              }
            >
              거래완료
            </button>

            <button
              type="button"
              className="status-btn stop"
              disabled={
                isUpdating ||
                selectedDeal.statusCode ===
                "CANCELLED"
              }
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
              disabled={isUpdating}
            >
              {isUpdating
                ? "처리 중"
                : "확인"}
            </button>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminFinalDealManagePage;