import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  normalizeCar,
} from "../../utils/carViewUtils";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import {
  getWishlistCarIds,
  toggleWishlist,
  WISHLIST_CHANGE_EVENT,
} from "../../api/wishlistApi";
import "../../css/car/carCard.css";

function getAuctionRemainText(endDate) {
  if (!endDate) {
    return "마감일 미정";
  }

  const diff =
    new Date(endDate) -
    new Date();

  if (diff <= 0) {
    return "경매 종료";
  }

  const day = Math.floor(
    diff /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

  const hour = Math.floor(
    (
      diff /
      (
        1000 *
        60 *
        60
      )
    ) % 24
  );

  return day > 0
    ? `${day}일 ${hour}시간 남음`
    : `${hour}시간 남음`;
}

function CarCard({
  car,
}) {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [isWished, setIsWished] =
    useState(false);

  const [
    isWishlistLoading,
    setIsWishlistLoading,
  ] = useState(false);

  const viewCar =
    normalizeCar(car);

  const isAuction =
    viewCar.saleType ===
    "AUCTION";

  const auction =
    viewCar.auction;

  const remainText =
    isAuction
      ? getAuctionRemainText(
        auction?.endDate
      )
      : "일반 판매";

  const status =
    auction?.status ||
    viewCar.status;

  const isDone =
    [
      "경매종료",
      "낙찰완료",
      "판매완료",
    ].includes(status) ||
    remainText ===
    "경매 종료";

  const imageUrl =
    viewCar.imageUrl ||
    viewCar.images?.[0]
      ?.imageUrl ||
    "";

  const loginDealerId = Number(loginUser?.dealerId || loginUser?.id || 0);
  const loginMemberId = Number(loginUser?.memberId || loginUser?.id || 0);

  const carDealerId = Number(viewCar.dealerId || viewCar.dealer?.id || (viewCar.ownerType === "DEALER" ? viewCar.ownerId : 0));
  const carMemberId = Number(viewCar.memberId || viewCar.member?.id || (viewCar.ownerType === "MEMBER" ? viewCar.ownerId : 0));

  const isMyOwnCar =
    (loginUser?.role === AUTH_ROLES.DEALER && loginDealerId > 0 && carDealerId > 0 && loginDealerId === carDealerId) ||
    (loginUser?.role === AUTH_ROLES.MEMBER && loginMemberId > 0 && carMemberId > 0 && loginMemberId === carMemberId);

  const canUseWishlist =
    !isMyOwnCar &&
    [
      AUTH_ROLES.MEMBER,
      AUTH_ROLES.DEALER,
    ].includes(
      loginUser?.role
    );

  useEffect(() => {
    let isMounted = true;

    async function loadWishlistStatus() {
      if (!canUseWishlist) {
        setIsWished(false);
        return;
      }

      try {
        const carIds =
          await getWishlistCarIds({ force: true });

        if (isMounted) {
          setIsWished(
            carIds.includes(
              Number(viewCar.id)
            )
          );
        }
      } catch (error) {
        console.error(
          "찜 상태 조회 실패:",
          error
        );
      }
    }

    function handleWishlistChange(
      event
    ) {
      const eventUserId = event.detail?.userLoginId;
      if (eventUserId && loginUser?.loginId && eventUserId !== loginUser.loginId) {
        return;
      }

      if (
        Number(
          event.detail?.carId
        ) ===
        Number(viewCar.id)
      ) {
        setIsWished(
          Boolean(
            event.detail
              ?.isWished
          )
        );
      }
    }

    loadWishlistStatus();

    window.addEventListener(
      WISHLIST_CHANGE_EVENT,
      handleWishlistChange
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        WISHLIST_CHANGE_EVENT,
        handleWishlistChange
      );
    };
  }, [
    canUseWishlist,
    viewCar.id,
    loginUser?.loginId,
  ]);

  async function handleWishlistClick(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!loginUser) {
      navigate(
        `/login?from=${encodeURIComponent(
          `/cars/${viewCar.id}`
        )}`
      );

      return;
    }

    if (
      !canUseWishlist ||
      isWishlistLoading
    ) {
      return;
    }

    try {
      setIsWishlistLoading(
        true
      );

      const result =
        await toggleWishlist(
          viewCar.id
        );

      setIsWished(
        Boolean(
          result?.isWished
        )
      );
    } catch (error) {
      console.error(
        "찜 변경 실패:",
        error
      );

      window.alert(
        error?.message ||
        "찜 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsWishlistLoading(
        false
      );
    }
  }

  return (
    <article className="car-card">
      {canUseWishlist && (
        <button
          type="button"
          className={`car-card-wishlist-button ${isWished
              ? "is-active"
              : ""
            }`}
          onClick={
            handleWishlistClick
          }
          disabled={
            isWishlistLoading
          }
          aria-label={
            isWished
              ? "찜 해제"
              : "찜 등록"
          }
          aria-pressed={
            isWished
          }
          title={
            isWished
              ? "찜 해제"
              : "찜 등록"
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 21s-7.2-4.35-9.55-8.37C.45 9.2 1.43 5.1 5.08 3.75c2.22-.82 4.65-.08 5.92 1.67 1.27-1.75 3.7-2.49 5.92-1.67 3.65 1.35 4.63 5.45 2.63 8.88C19.2 16.65 12 21 12 21Z"
            />
          </svg>
        </button>
      )}

      <Link
        to={`/cars/${viewCar.id}`}
        className="car-card-link"
      >
        <div className="car-card-image">
          {viewCar.goldenBadgeStatus && (
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                zIndex: 2,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#ffffff",
                fontSize: "0.72rem",
                fontWeight: "bold",
                padding: "3px 8px",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "3px"
              }}
            >
              🏆 Top 5%
            </span>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                viewCar.carName ||
                "차량 이미지"
              }
              loading="lazy"
              onError={(
                event
              ) => {
                event.currentTarget.style.display =
                  "none";

                const fallback =
                  event
                    .currentTarget
                    .nextElementSibling;

                if (fallback) {
                  fallback.style.display =
                    "flex";
                }
              }}
            />
          ) : null}

          <span
            className="car-card-image-fallback"
            style={{
              display:
                imageUrl
                  ? "none"
                  : "flex",
            }}
          >
            {viewCar.imageText ||
              "CAR"}
          </span>
        </div>

        <div className="car-card-body">
          <div className="car-card-title-row">
            <h3>
              {viewCar.carName}
            </h3>

            <span
              className={`status-badge ${isDone
                  ? "done"
                  : ""
                }`}
            >
              {status}
            </span>
          </div>

          <ul className="car-card-spec">
            <li>
              {viewCar.year}년식
            </li>

            <li>
              {Number(
                viewCar.mileage ||
                0
              ).toLocaleString()}
              km
            </li>

            <li>
              {viewCar.fuel}
            </li>

            <li>
              {
                viewCar.transmission
              }
            </li>
          </ul>

          <div className="car-card-meta">
            <span>
              {viewCar.region}
            </span>

            <span>
              {
                viewCar.sellerType
              }
            </span>
          </div>

          <div className="car-card-auction-info">
            <div>
              <span>
                {isAuction
                  ? "경매 시작가"
                  : "판매 가격"}
              </span>

              <strong>
                {Number(
                  isAuction
                    ? auction
                      ?.startPrice
                    : viewCar.price
                ).toLocaleString()}
                만원
              </strong>
            </div>

            <div>
              <span>
                {isAuction
                  ? "입찰"
                  : "거래 방식"}
              </span>

              <strong>
                {isAuction
                  ? `${auction
                    ?.bidCount ||
                  0
                  }건`
                  : "일반거래"}
              </strong>
            </div>
          </div>

          <div className="car-card-price-row">
            <strong>
              {remainText}
            </strong>

            <span>
              상세보기
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default CarCard;