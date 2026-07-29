import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  getTransactionDetail,
  updateTransactionStatus,
} from "../../api/transactionApi";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import "../../css/member/memberAuctionTradePage.css";

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

function getStatusText(status) {
  const statusMap = {
    PENDING_PAYMENT:
      "결제대기",

    PAID:
      "결제완료",

    COMPLETED:
      "거래완료",

    CANCELLED:
      "거래취소",
  };

  return (
    statusMap[status] ||
    status ||
    "-"
  );
}

function getParticipantTypeText(
  participantType
) {
  const typeMap = {
    MEMBER:
      "일반회원",

    DEALER:
      "딜러",

    COMPANY:
      "회사",

    ADMIN:
      "관리자",
  };

  return (
    typeMap[participantType] ||
    participantType ||
    "-"
  );
}

function MemberAuctionTradePage() {
  const {
    transactionId,
  } = useParams();

  const {
    loginUser,
  } = useAuth();

  const [
    transaction,
    setTransaction,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  useEffect(() => {
    let isCancelled = false;

    if (!transactionId) {
      queueMicrotask(() => {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          "거래 ID를 확인할 수 없습니다."
        );

        setIsLoading(false);
      });

      return () => {
        isCancelled = true;
      };
    }

    getTransactionDetail(
      transactionId
    )
      .then((result) => {
        if (isCancelled) {
          return;
        }

        setTransaction(result);
        setErrorMessage("");
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "거래 상세 조회 실패:",
          error
        );

        setTransaction(null);

        setErrorMessage(
          error?.message ||
          "거래 정보를 불러오지 못했습니다."
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
  }, [transactionId]);

  const dealInfo =
    useMemo(() => {
      if (!transaction) {
        return null;
      }

      const dealPrice =
        Number(
          transaction.dealPrice ||
          0
        );

      const commissionRate =
        Number(
          transaction.commissionRate ||
          0
        );

      const commissionAmount =
        Number(
          transaction.commissionAmount ||
          0
        );

      return {
        dealPrice,
        commissionRate,
        commissionPercent:
          commissionRate * 100,

        commissionAmount,

        totalPrice:
          dealPrice +
          commissionAmount,
      };
    }, [transaction]);

  const carName =
    [
      transaction?.carMake,
      transaction?.carModel,
    ]
      .filter(Boolean)
      .join(" ") ||
    "거래 차량";

  const status =
    transaction?.status ||
    "PENDING_PAYMENT";

  const isPaid =
    status === "PAID";

  const isCompleted =
    status === "COMPLETED";

  const isCancelled =
    status === "CANCELLED";

  const canMarkPaid =
    status ===
    "PENDING_PAYMENT";

  const canComplete =
    status === "PAID";

  const canCancel =
    !isCompleted &&
    !isCancelled;

  async function handleStatusUpdate(
    nextStatus
  ) {
    if (
      isUpdating ||
      !transactionId
    ) {
      return;
    }

    let confirmMessage = "";

    if (
      nextStatus === "PAID"
    ) {
      confirmMessage =
        "결제완료 상태로 변경하시겠습니까?";
    }

    if (
      nextStatus === "COMPLETED"
    ) {
      confirmMessage =
        "최종 거래완료 상태로 변경하시겠습니까?";
    }

    if (
      nextStatus === "CANCELLED"
    ) {
      confirmMessage =
        "거래를 취소하시겠습니까?";
    }

    if (
      confirmMessage &&
      !window.confirm(
        confirmMessage
      )
    ) {
      return;
    }

    try {
      setIsUpdating(true);
      setActionMessage(
        "거래 상태를 변경하고 있습니다."
      );

      const updatedTransaction =
        await updateTransactionStatus(
          transactionId,
          nextStatus
        );

      setTransaction(
        updatedTransaction
      );

      setActionMessage(
        `거래 상태가 ${getStatusText(
          updatedTransaction.status
        )}(으)로 변경되었습니다.`
      );
    } catch (error) {
      console.error(
        "거래 상태 변경 실패:",
        error
      );

      setActionMessage(
        error?.message ||
        "거래 상태 변경 중 오류가 발생했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <main className="member-trade-page">
        <div className="member-trade-container">
          <section className="member-trade-empty">
            <h2>
              거래 정보를 불러오는 중입니다.
            </h2>

            <p>
              잠시만 기다려주세요.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !transaction ||
    !dealInfo
  ) {
    return (
      <main className="member-trade-page">
        <div className="member-trade-container">
          <section className="member-trade-empty">
            <h2>
              거래 정보를 찾을 수 없습니다.
            </h2>

            <p>
              {errorMessage ||
                "존재하지 않거나 접근 권한이 없는 거래입니다."}
            </p>

            <Link
              to={
                loginUser?.role ===
                  AUTH_ROLES.DEALER
                  ? "/dealer/bids"
                  : "/member"
              }
            >
              이전 화면으로
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="member-trade-page">
      <div className="member-trade-container">
        <section className="member-trade-header">
          <div>
            <p className="page-label">
              FINAL DEAL
            </p>

            <h2>
              최종 거래 / 결제 관리
            </h2>

            <p>
              DB에 저장된 최종 거래 정보를 확인합니다.
            </p>
          </div>

          <Link
            to={
              loginUser?.role ===
                AUTH_ROLES.DEALER
                ? "/dealer/bids"
                : "/member"
            }
            className="member-trade-outline-link"
          >
            이전 화면
          </Link>
        </section>

        <section className="member-trade-status-box">
          <div>
            <span>
              현재 거래 상태
            </span>

            <strong
              className={`member-trade-status ${getStatusText(
                status
              )}`}
            >
              {getStatusText(
                status
              )}
            </strong>
          </div>

          <p>
            거래 상태는 서버와 DB에 실시간으로 반영됩니다.
          </p>
        </section>

        {actionMessage && (
          <section className="member-trade-status-box">
            <p>
              {actionMessage}
            </p>
          </section>
        )}

        <section className="member-trade-grid">
          <article className="member-trade-card">
            <h3>
              차량 정보
            </h3>

            <div className="member-trade-car-box">
              <div className="member-trade-car-image">
                {transaction.carImageUrl ? (
                  <img
                    src={
                      transaction.carImageUrl
                    }
                    alt={`${carName} 차량`}
                  />
                ) : (
                  "CAR"
                )}
              </div>

              <div>
                <strong>
                  {carName}
                </strong>

                <span>
                  차량 ID:{" "}
                  {transaction.carId}
                </span>

                <Link
                  to={`/cars/${transaction.carId}`}
                >
                  차량 상세보기
                </Link>
              </div>
            </div>
          </article>

          <article className="member-trade-card">
            <h3>
              거래 대상
            </h3>

            <dl className="member-trade-info-list">
              <div>
                <dt>
                  구매자 유형
                </dt>

                <dd>
                  {getParticipantTypeText(
                    transaction.buyerType
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  구매자 ID
                </dt>

                <dd>
                  {transaction.buyerId}
                </dd>
              </div>

              <div>
                <dt>
                  판매자 유형
                </dt>

                <dd>
                  {getParticipantTypeText(
                    transaction.sellerType
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  판매자 ID
                </dt>

                <dd>
                  {transaction.sellerId}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="member-trade-card member-trade-payment-card">
          <div className="member-trade-card-header">
            <div>
              <h3>
                결제 예정 금액
              </h3>

              <p>
                낙찰가와 서버에 저장된 수수료를 기준으로 계산합니다.
              </p>
            </div>
          </div>

          <dl className="member-trade-price-list">
            <div>
              <dt>
                낙찰가
              </dt>

              <dd>
                {dealInfo.dealPrice.toLocaleString()}
                만원
              </dd>
            </div>

            <div>
              <dt>
                수수료율
              </dt>

              <dd>
                {dealInfo.commissionPercent.toLocaleString()}
                %
              </dd>
            </div>

            <div>
              <dt>
                수수료
              </dt>

              <dd>
                {dealInfo.commissionAmount.toLocaleString()}
                만원
              </dd>
            </div>

            <div className="total">
              <dt>
                총 결제 예정 금액
              </dt>

              <dd>
                {dealInfo.totalPrice.toLocaleString()}
                만원
              </dd>
            </div>
          </dl>

          <div className="member-trade-actions">
            <button
              type="button"
              className="member-trade-primary-btn"
              onClick={() =>
                handleStatusUpdate(
                  "PAID"
                )
              }
              disabled={
                isUpdating ||
                !canMarkPaid
              }
            >
              {isPaid
                ? "결제완료됨"
                : "결제완료 처리"}
            </button>

            <button
              type="button"
              className="member-trade-primary-btn"
              onClick={() =>
                handleStatusUpdate(
                  "COMPLETED"
                )
              }
              disabled={
                isUpdating ||
                !canComplete
              }
            >
              {isCompleted
                ? "거래완료됨"
                : "거래완료 처리"}
            </button>

            <button
              type="button"
              className="member-trade-outline-btn"
              onClick={() =>
                handleStatusUpdate(
                  "CANCELLED"
                )
              }
              disabled={
                isUpdating ||
                !canCancel
              }
            >
              {isCancelled
                ? "거래취소됨"
                : "거래취소"}
            </button>
          </div>
        </section>

        <section className="member-trade-card">
          <h3>
            거래 기록
          </h3>

          <dl className="member-trade-info-list">
            <div>
              <dt>
                거래 ID
              </dt>

              <dd>
                {transaction.transactionId}
              </dd>
            </div>

            <div>
              <dt>
                거래 생성일
              </dt>

              <dd>
                {formatDateTime(
                  transaction.createdAt
                )}
              </dd>
            </div>

            <div>
              <dt>
                결제 완료일
              </dt>

              <dd>
                {formatDateTime(
                  transaction.paidAt
                )}
              </dd>
            </div>

            <div>
              <dt>
                거래 완료일
              </dt>

              <dd>
                {formatDateTime(
                  transaction.completedAt
                )}
              </dd>
            </div>

            <div>
              <dt>
                거래 취소일
              </dt>

              <dd>
                {formatDateTime(
                  transaction.cancelledAt
                )}
              </dd>
            </div>

            <div>
              <dt>
                현재 로그인 계정
              </dt>

              <dd>
                {loginUser?.name ||
                  loginUser?.dealerName ||
                  loginUser?.memberName ||
                  "로그인 사용자"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}

export default MemberAuctionTradePage;