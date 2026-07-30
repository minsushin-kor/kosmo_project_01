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
import { getAdminTransactions } from "../../api/transactionApi";
import "../../css/admin/adminManagePage.css";

const STATUS_LABEL_MAP = {
  PENDING_PAYMENT: "결제대기",
  PAID: "결제완료",
  COMPLETED: "거래완료",
  CANCELLED: "거래취소",
};

function formatParticipant(type, id) {
  const normalizedType = String(type || "").toUpperCase();

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

function normalizeTransaction(transaction) {
  const dealPrice = Number(transaction.dealPrice || 0);

  const commissionAmount = Number(
    transaction.commissionAmount || 0
  );

  const status = String(
    transaction.status || "PENDING_PAYMENT"
  ).toUpperCase();

  const carName =
    [transaction.carMake, transaction.carModel]
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
    feePrice: commissionAmount,
    totalPrice: dealPrice + commissionAmount,
    status: STATUS_LABEL_MAP[status] || status,
  };
}

function AdminFinalDealManagePage() {
  const [finalDeals, setFinalDeals] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("전체");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadFinalDeals = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const transactions =
        await getAdminTransactions();

      setFinalDeals(
        transactions.map(normalizeTransaction)
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
  }, []);

  useEffect(() => {
    let isActive = true;

    getAdminTransactions()
      .then((transactions) => {
        if (!isActive) {
          return;
        }

        setFinalDeals(
          transactions.map(normalizeTransaction)
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
    setStatusFilter("전체");
  }

  const filteredDeals = useMemo(() => {
    const keyword = searchText
      .trim()
      .toLowerCase();

    return finalDeals.filter((deal) => {
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
        String(deal.carId || "").includes(keyword) ||
        String(
          deal.transactionId || ""
        ).includes(keyword);

      const statusMatch =
        statusFilter === "전체" ||
        deal.status === statusFilter;

      return keywordMatch && statusMatch;
    });
  }, [finalDeals, searchText, statusFilter]);

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
          ).toLocaleString("ko-KR")}만원`,
      },
      {
        key: "feePrice",
        label: "수수료",
        render: (deal) =>
          `${Number(
            deal.feePrice || 0
          ).toLocaleString("ko-KR")}만원`,
      },
      {
        key: "totalPrice",
        label: "총액",
        render: (deal) =>
          `${Number(
            deal.totalPrice || 0
          ).toLocaleString("ko-KR")}만원`,
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
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        name: "status",
        value: statusFilter,
        onChange: setStatusFilter,
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
      description="경매 낙찰 이후 생성된 최종 거래 목록을 조회합니다."
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>최종 거래 목록</h3>

            <p className="admin-panel-sub-text">
              거래 DB에 저장된 낙찰 거래와 현재
              결제 상태를 조회합니다.
            </p>
          </div>

          <button
            type="button"
            className="small-btn"
            onClick={loadFinalDeals}
            disabled={isLoading}
          >
            {isLoading ? "조회 중" : "새로고침"}
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
          onSearchChange={setSearchText}
          searchPlaceholder="거래번호, 차량명, 구매자, 판매자 검색"
          filters={filters}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={isLoading ? [] : filteredDeals}
          totalCount={filteredDeals.length}
          emptyMessage={
            isLoading
              ? "최종 거래 목록을 불러오는 중입니다."
              : "조회된 최종 거래가 없습니다."
          }
        />
      </section>
    </AdminLayout>
  );
}

export default AdminFinalDealManagePage;