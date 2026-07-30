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
import {
  getAdminTransactions,
} from "../../api/transactionApi";
import "../../css/admin/adminManagePage.css";

function formatParticipant(type, id) {
  const normalizedType = String(
    type || ""
  ).toUpperCase();

  let typeLabel =
    normalizedType || "사용자";

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

function normalizeTransaction(transaction) {
  const dealPrice = Number(
    transaction?.dealPrice || 0
  );

  const commissionAmount = Number(
    transaction?.commissionAmount || 0
  );

  const status = String(
    transaction?.status || ""
  ).toUpperCase();

  const carName =
    [
      transaction?.carMake,
      transaction?.carModel,
    ]
      .filter(Boolean)
      .join(" ") ||
    `차량 #${transaction?.carId ?? "-"}`;

  return {
    ...transaction,
    id:
      transaction?.transactionId ??
      transaction?.id,
    transactionId:
      transaction?.transactionId ??
      transaction?.id,
    carName,
    buyerName: formatParticipant(
      transaction?.buyerType,
      transaction?.buyerId
    ),
    sellerName: formatParticipant(
      transaction?.sellerType,
      transaction?.sellerId
    ),
    winningPrice: dealPrice,
    feePrice: commissionAmount,
    totalPrice:
      dealPrice + commissionAmount,
    status,
    statusLabel:
      status === "COMPLETED"
        ? "거래완료"
        : status,
  };
}

function formatMoney(value) {
  return Number(
    value || 0
  ).toLocaleString("ko-KR");
}

function AdminFinalDealManagePage() {
  const [
    completedDeals,
    setCompletedDeals,
  ] = useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadCompletedDeals =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const transactions =
          await getAdminTransactions();

        const normalizedDeals =
          transactions
            .map(normalizeTransaction)
            .filter(
              (transaction) =>
                transaction.status ===
                "COMPLETED"
            );

        setCompletedDeals(
          normalizedDeals
        );
      } catch (error) {
        console.error(
          "관리자 매출 거래 목록 조회 실패:",
          error
        );

        setCompletedDeals([]);

        setErrorMessage(
          error?.message ||
          "거래완료 목록을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    let isActive = true;

    getAdminTransactions()
      .then((transactions) => {
        if (!isActive) {
          return;
        }

        const normalizedDeals =
          transactions
            .map(normalizeTransaction)
            .filter(
              (transaction) =>
                transaction.status ===
                "COMPLETED"
            );

        setCompletedDeals(
          normalizedDeals
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(
          "관리자 매출 거래 목록 조회 실패:",
          error
        );

        setCompletedDeals([]);

        setErrorMessage(
          error?.message ||
          "거래완료 목록을 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function handleResetFilter() {
    setSearchText("");
  }

  const salesSummary = useMemo(() => {
    return completedDeals.reduce(
      (summary, deal) => ({
        totalWinningPrice:
          summary.totalWinningPrice +
          Number(
            deal.winningPrice || 0
          ),
        totalCommission:
          summary.totalCommission +
          Number(
            deal.feePrice || 0
          ),
      }),
      {
        totalWinningPrice: 0,
        totalCommission: 0,
      }
    );
  }, [completedDeals]);

  const filteredDeals = useMemo(() => {
    const keyword = searchText
      .trim()
      .toLowerCase();

    if (!keyword) {
      return completedDeals;
    }

    return completedDeals.filter(
      (deal) =>
        String(
          deal.transactionId || ""
        )
          .toLowerCase()
          .includes(keyword) ||
        deal.carName
          .toLowerCase()
          .includes(keyword) ||
        deal.buyerName
          .toLowerCase()
          .includes(keyword) ||
        deal.sellerName
          .toLowerCase()
          .includes(keyword)
    );
  }, [
    completedDeals,
    searchText,
  ]);

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
        render: (deal) => {
          if (!deal.carId) {
            return deal.carName;
          }

          return (
            <Link
              to={`/cars/${deal.carId}`}
              className="admin-post-link"
            >
              {deal.carName}
            </Link>
          );
        },
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
          `${formatMoney(
            deal.winningPrice
          )}만원`,
      },
      {
        key: "feePrice",
        label: "수수료",
        render: (deal) =>
          `${formatMoney(
            deal.feePrice
          )}만원`,
      },
      {
        key: "totalPrice",
        label: "총액",
        render: (deal) =>
          `${formatMoney(
            deal.totalPrice
          )}만원`,
      },
      {
        key: "statusLabel",
        label: "거래상태",
        render: (deal) => (
          <span className="manage-badge 거래완료">
            {deal.statusLabel}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <AdminLayout
      title="매출 관리"
      description="거래완료 데이터를 기준으로 낙찰 금액과 수수료 매출을 조회합니다."
    >
      <section className="admin-sales-summary-grid">
        <article className="admin-sales-summary-card">
          <div className="admin-sales-summary-icon">
            ₩
          </div>

          <div className="admin-sales-summary-content">
            <span>총 낙찰가</span>

            <strong>
              {formatMoney(
                salesSummary.totalWinningPrice
              )}
              <small>만원</small>
            </strong>

            <p>
              거래완료{" "}
              {completedDeals.length.toLocaleString(
                "ko-KR"
              )}
              건의 낙찰가 합계
            </p>
          </div>
        </article>

        <article className="admin-sales-summary-card commission">
          <div className="admin-sales-summary-icon">
            %
          </div>

          <div className="admin-sales-summary-content">
            <span>
              총 수수료 매출
            </span>

            <strong>
              {formatMoney(
                salesSummary.totalCommission
              )}
              <small>만원</small>
            </strong>

            <p>
              전체 거래완료 건에서 발생한
              수수료 합계
            </p>
          </div>
        </article>
      </section>

      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>거래완료 목록</h3>

            <p className="admin-panel-sub-text">
              DB에 저장된 거래 중
              거래완료 상태인 목록만
              조회합니다.
            </p>
          </div>

          <button
            type="button"
            className="small-btn"
            onClick={
              loadCompletedDeals
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
          filters={[]}
          checkboxFilters={[]}
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
              ? "거래완료 목록을 불러오는 중입니다."
              : "조회된 거래완료 내역이 없습니다."
          }
        />
      </section>
    </AdminLayout>
  );
}

export default AdminFinalDealManagePage;