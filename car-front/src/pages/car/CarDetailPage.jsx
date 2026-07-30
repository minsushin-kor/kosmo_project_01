import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  deleteCar,
  getCarDetail,
} from "../../api/carApi";
import {
  createOrGetChatRoom,
  getChatRoomMessages,
  sendChatMessage,
} from "../../api/chatApi";
import {
  openMessageRoom,
  refreshMessageRooms,
} from "../../components/message/messageStorage";
import {
  placeAuctionBid,
} from "../../api/auctionApi";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import {
  saveRecentCarId,
} from "../../utils/carRecommendationStorage";
import {
  saveNormalTrade,
} from "../../utils/normalTradeStorage";
import "../../css/car/carDetailPage.css";

import {
  getWishlistCarIds,
  toggleWishlist,
  WISHLIST_CHANGE_EVENT,
} from "../../api/wishlistApi";

const AUCTION_WINNERS_KEY =
  "car_front_auction_winners";


function formatDateTime(dateText) {
  if (!dateText) {
    return "미정";
  }

  const date = new Date(dateText);

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

function getAuctionRemainText(
  endDate
) {
  if (!endDate) {
    return "마감일 미정";
  }

  const now = new Date();
  const end = new Date(
    endDate
  );

  const diff =
    end.getTime() -
    now.getTime();

  if (
    Number.isNaN(
      end.getTime()
    )
  ) {
    return "마감일 미정";
  }

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
    ) %
    24
  );

  const minute =
    Math.floor(
      (
        diff /
        (
          1000 *
          60
        )
      ) %
      60
    );

  if (day > 0) {
    return `${day}일 ${hour}시간 남음`;
  }

  if (hour > 0) {
    return `${hour}시간 ${minute}분 남음`;
  }

  return `${minute}분 남음`;
}

function getAuctionWinners() {
  try {
    return JSON.parse(
      localStorage.getItem(
        AUCTION_WINNERS_KEY
      ) || "[]"
    );
  } catch (error) {
    console.error(
      "낙찰 정보 조회 실패:",
      error
    );

    return [];
  }
}

function getLoginUserId(
  loginUser
) {
  return (
    loginUser?.id ||
    loginUser?.memberId ||
    loginUser?.dealerId ||
    loginUser?.companyId ||
    null
  );
}

function getLoginUserName(
  loginUser
) {
  return (
    loginUser?.name ||
    loginUser?.memberName ||
    loginUser?.dealerName ||
    loginUser?.companyName ||
    "구매자"
  );
}

function CarDetailPage() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const { loginUser } =
    useAuth();

  const wishlistCarId =
    Number(id);

  const [
    isWished,
    setIsWished,
  ] = useState(false);

  const [
    isWishlistLoading,
    setIsWishlistLoading,
  ] = useState(false);

  const [car, setCar] =
    useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    bidPrice,
    setBidPrice,
  ] = useState("");

  const [
    bidMessage,
    setBidMessage,
  ] = useState("");

  const [
    isBidSubmitting,
    setIsBidSubmitting,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    ownerActionMessage,
    setOwnerActionMessage,
  ] = useState("");

  const [
    tradeMessage,
    setTradeMessage,
  ] = useState("");

  const [
    bidList,
    setBidList,
  ] = useState([]);

  const normalizedLoginRole =
    String(
      loginUser?.role ||
      loginUser?.serverRole ||
      ""
    ).toUpperCase();

  const canUseWishlist =
    [
      AUTH_ROLES.MEMBER,
      AUTH_ROLES.DEALER,
    ].includes(
      normalizedLoginRole
    );

  useEffect(() => {
    let isMounted = true;

    async function loadCarDetail() {
      try {
        setIsLoading(true);
        setLoadError("");

        const result =
          await getCarDetail(
            id
          );

        if (!isMounted) {
          return;
        }

        setCar(result);

        const imageList =
          Array.isArray(
            result?.images
          )
            ? result.images
            : [];

        const mainImageIndex =
          imageList.findIndex(
            (image) =>
              image?.isMain ===
              true
          );

        setSelectedImageIndex(
          mainImageIndex >= 0
            ? mainImageIndex
            : 0
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          "차량 상세 조회 실패:",
          error
        );

        setCar(null);

        setLoadError(
          error?.response?.data
            ?.message ||
          error?.message ||
          "차량 정보를 불러오지 못했습니다."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCarDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function loadWishlistStatus() {
      if (
        !canUseWishlist ||
        !Number.isFinite(
          wishlistCarId
        )
      ) {
        if (isMounted) {
          setIsWished(false);
        }

        return;
      }

      try {
        const carIds =
          await getWishlistCarIds();

        if (isMounted) {
          setIsWished(
            carIds.includes(
              wishlistCarId
            )
          );
        }
      } catch (error) {
        console.error(
          "상세 페이지 찜 상태 조회 실패:",
          error
        );
      }
    }

    function handleWishlistChange(
      event
    ) {
      if (
        Number(
          event.detail?.carId
        ) !== wishlistCarId
      ) {
        return;
      }

      setIsWished(
        Boolean(
          event.detail
            ?.isWished
        )
      );
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
    wishlistCarId,
  ]);

  useEffect(() => {
    if (car?.id) {
      saveRecentCarId(
        car.id
      );
    }
  }, [car?.id]);

  const auctionWinner =
    useMemo(() => {
      return getAuctionWinners().find(
        (winner) =>
          Number(
            winner.carId
          ) ===
          Number(id)
      );
    }, [id]);

  const myBid =
    useMemo(() => {
      if (!loginUser) {
        return null;
      }

      const bidderType =
        loginUser.role ||
        AUTH_ROLES.MEMBER;

      const bidderId =
        getLoginUserId(
          loginUser
        );

      if (!bidderId) {
        return null;
      }

      return bidList.find(
        (bid) =>
          bid.bidderType ===
          bidderType &&
          Number(
            bid.bidderId
          ) ===
          Number(bidderId)
      );
    }, [
      bidList,
      loginUser,
    ]);

  const carImages =
    Array.isArray(
      car?.images
    )
      ? car.images.filter(
        (image) =>
          Boolean(
            image?.imageUrl
          )
      )
      : [];

  const selectedImage =
    carImages[
    selectedImageIndex
    ] ||
    carImages.find(
      (image) =>
        image.isMain === true
    ) ||
    carImages[0] ||
    null;

  if (isLoading) {
    return (
      <main className="car-detail-page">
        <div className="car-detail-empty">
          <h2>
            차량 정보를
            불러오는 중입니다.
          </h2>

          <p>
            잠시만 기다려주세요.
          </p>
        </div>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="car-detail-page">
        <div className="car-detail-empty">
          <h2>
            차량 정보를 찾을 수
            없습니다.
          </h2>

          <p>
            {loadError ||
              "삭제되었거나 존재하지 않는 차량입니다."}
          </p>

          <Link
            to="/"
            className="back-link"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const carId =
    car.id ||
    car.carId ||
    Number(id);

  const memberId =
    car.memberId ||
    car.member?.memberId ||
    null;

  const dealerId =
    car.dealerId ||
    car.dealer?.dealerId ||
    null;

  const companyId =
    car.companyId ||
    car.dealer?.companyId ||
    car.company?.companyId ||
    null;

  const isDealerCar =
    Boolean(dealerId) &&
    !memberId;

  const isMemberCar =
    Boolean(memberId) &&
    !dealerId;

  const isAuctionCar =
    car.saleType ===
    "AUCTION" ||
    isMemberCar;

  const isNormalSaleCar =
    car.saleType ===
    "NORMAL" ||
    isDealerCar;

  const loginMemberId =
    Number(
      loginUser?.memberId
    );

  const loginDealerId =
    Number(
      loginUser?.dealerId
    );

  const isOwner =
    (
      isMemberCar &&
      normalizedLoginRole ===
      AUTH_ROLES.MEMBER &&
      Number.isFinite(
        loginMemberId
      ) &&
      loginMemberId ===
      Number(memberId)
    ) ||
    (
      isDealerCar &&
      normalizedLoginRole ===
      AUTH_ROLES.DEALER &&
      Number.isFinite(
        loginDealerId
      ) &&
      loginDealerId ===
      Number(dealerId)
    );

  const carName =
    car.carName ||
    `${car.brand || car.make || ""} ${car.modelName ||
      car.model ||
      ""
      }`.trim() ||
    "차량";

  const brand =
    car.brand ||
    car.make ||
    "-";

  const modelName =
    car.modelName ||
    car.model ||
    "-";

  const mileage =
    Number(
      car.mileage ??
      car.odometer ??
      0
    );

  const price =
    Number(
      car.price ??
      car.sellingPrice ??
      0
    );

  const fuel =
    car.fuel ||
    "미등록";

  const region =
    car.region ||
    car.state ||
    "미등록";

  const sellerName =
    car.sellerName ||
    car.memberName ||
    car.dealerName ||
    car.member?.name ||
    car.dealer?.name ||
    "판매자";

  const sellerPhone =
    car.sellerPhone ||
    car.memberPhone ||
    car.dealerPhone ||
    car.member?.phone ||
    car.dealer?.phone ||
    "연락처 미등록";

  const companyName =
    car.companyName ||
    car.company?.companyName ||
    car.dealer?.companyName ||
    "소속 회사";

  const optionList =
    Array.isArray(
      car.options
    )
      ? car.options
      : typeof car.option ===
        "string" &&
        car.option.trim()
        ? car.option
          .split(",")
          .map((option) =>
            option.trim()
          )
          .filter(Boolean)
        : [];

  const auction =
    isAuctionCar
      ? car.auction || {
        auctionId:
          car.auctionId ||
          carId,

        startPrice:
          car.startPrice ||
          price,

        bidCount:
          car.bidCount ||
          0,

        startDate:
          car.startDate ||
          car.startTime ||
          car.registeredDate,

        endDate:
          car.endDate ||
          car.endTime ||
          null,

        status:
          car.auctionStatus ||
          car.status ||
          "경매중",

        winningBidPrice:
          null,

        winningBidderName:
          null,
      }
      : null;

  const remainText =
    isAuctionCar
      ? getAuctionRemainText(
        auction.endDate
      )
      : "일반 판매";

  const originBidCount =
    isAuctionCar
      ? Number(
        auction.bidCount ||
        0
      )
      : 0;

  const totalBidCount =
    originBidCount +
    bidList.length;

  const auctionStatus =
    isAuctionCar
      ? auction.status ||
      car.status ||
      "경매중"
      : "판매중";

  const isAuctionDone =
    isAuctionCar &&
    (
      Boolean(
        auctionWinner
      ) ||
      auctionStatus ===
      "경매종료" ||
      auctionStatus ===
      "낙찰완료" ||
      auctionStatus ===
      "ENDED" ||
      auctionStatus ===
      "COMPLETED" ||
      remainText ===
      "경매 종료"
    );

  const canPlaceBid =
    isAuctionCar &&
    !isOwner &&
    normalizedLoginRole ===
    AUTH_ROLES.DEALER &&
    !isAuctionDone &&
    !myBid;

  const ownerEditPath =
    isMemberCar
      ? `/member/cars/${carId}/edit`
      : `/dealer/cars/${carId}/edit`;

  const ownerManagePath =
    isAuctionCar
      ? `/member/cars/${carId}/bids`
      : "/dealer/cars";

  const sellerId =
    isDealerCar
      ? dealerId
      : memberId;

  const sellerProfilePath =
    isDealerCar
      ? `/company/dealers/${dealerId}`
      : `/members/${memberId}/cars`;

  const detailItems = [
    {
      label: "제조사",
      value: brand,
    },
    {
      label: "모델명",
      value: modelName,
    },
    {
      label: "연식",
      value: car.year
        ? `${car.year}년식`
        : "미등록",
    },
    {
      label: "주행거리",
      value: `${mileage.toLocaleString()}km`,
    },
    {
      label: "연료",
      value: fuel,
    },
    {
      label: "변속기",
      value:
        car.transmission ||
        "미등록",
    },
    {
      label: "차종",
      value:
        car.body ||
        car.bodyType ||
        "미등록",
    },
    {
      label: "배기량",
      value:
        car.displacement ||
        "미등록",
    },
    {
      label: "외장 색상",
      value:
        car.color ||
        "미등록",
    },
    {
      label: "내장 색상",
      value:
        car.interior ||
        "미등록",
    },
    {
      label: "사고이력",
      value:
        car.accident ||
        car.condition ||
        "미등록",
    },
    {
      label: "지역",
      value: region,
    },
    {
      label: "차량번호",
      value:
        car.carNumber ||
        "미등록",
    },
    {
      label: "등록일",
      value:
        formatDateTime(
          car.registeredDate ||
          car.createdAt
        ),
    },
  ];

  async function handleWishlistClick() {
    if (!loginUser) {
      navigate(
        `/login?from=${encodeURIComponent(
          `/cars/${wishlistCarId}`
        )}`
      );

      return;
    }

    if (!canUseWishlist) {
      window.alert(
        "일반회원 또는 딜러만 찜할 수 있습니다."
      );

      return;
    }

    if (
      isWishlistLoading ||
      !Number.isFinite(
        wishlistCarId
      )
    ) {
      return;
    }

    try {
      setIsWishlistLoading(
        true
      );

      const result =
        await toggleWishlist(
          wishlistCarId
        );

      setIsWished(
        Boolean(
          result.isWished
        )
      );
    } catch (error) {
      console.error(
        "상세 페이지 찜 변경 실패:",
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

  async function handleBidSubmit(
    event
  ) {
    event.preventDefault();

    if (isBidSubmitting) {
      return;
    }

    if (!isAuctionCar) {
      setBidMessage(
        "딜러 판매 매물은 입찰할 수 없습니다."
      );

      return;
    }

    if (!loginUser) {
      setBidMessage(
        "로그인 후 입찰할 수 있습니다."
      );

      return;
    }

    if (isOwner) {
      setBidMessage(
        "본인이 등록한 차량에는 입찰할 수 없습니다."
      );

      return;
    }

    if (
      normalizedLoginRole !==
      AUTH_ROLES.DEALER
    ) {
      setBidMessage(
        "회사 소속 딜러 계정만 입찰할 수 있습니다."
      );

      return;
    }

    if (isAuctionDone) {
      setBidMessage(
        "이미 종료된 경매입니다."
      );

      return;
    }

    const auctionId =
      auction.auctionId ||
      car.auctionId;

    if (!auctionId) {
      setBidMessage(
        "경매 정보를 확인할 수 없습니다."
      );

      return;
    }

    const priceNumber =
      Number(bidPrice);

    if (
      !Number.isFinite(
        priceNumber
      ) ||
      priceNumber <= 0
    ) {
      setBidMessage(
        "입찰 금액을 입력해주세요."
      );

      return;
    }

    if (
      priceNumber <
      Number(
        auction.startPrice ||
        0
      )
    ) {
      setBidMessage(
        "입찰 금액은 경매 시작가 이상으로 입력해주세요."
      );

      return;
    }

    if (myBid) {
      setBidMessage(
        "이미 입찰한 차량입니다. 블라인드 경매는 딜러당 한 번만 입찰할 수 있습니다."
      );

      return;
    }

    try {
      setIsBidSubmitting(
        true
      );

      setBidMessage(
        "입찰을 처리하고 있습니다."
      );

      const savedBid =
        await placeAuctionBid(
          auctionId,
          priceNumber
        );

      const normalizedBid = {
        id:
          savedBid?.bidId,

        bidId:
          savedBid?.bidId,

        carId:
          Number(carId),

        carName,

        auctionId:
          savedBid?.auctionId ||
          auctionId,

        bidderType:
          AUTH_ROLES.DEALER,

        bidderId:
          savedBid?.dealerId ||
          loginUser.dealerId ||
          getLoginUserId(
            loginUser
          ),

        bidderName:
          savedBid?.dealerName ||
          getLoginUserName(
            loginUser
          ),

        bidPrice:
          Number(
            savedBid?.bidAmount ??
            priceNumber
          ),

        bidStatus:
          savedBid?.status ||
          "입찰완료",

        createdAt:
          savedBid?.createdAt ||
          new Date().toISOString(),
      };

      setBidList(
        (previousBids) => [
          normalizedBid,
          ...previousBids.filter(
            (bid) =>
              String(
                bid.bidId ||
                bid.id
              ) !==
              String(
                normalizedBid.bidId
              )
          ),
        ]
      );

      setBidPrice("");

      setBidMessage(
        "입찰이 완료되었습니다. 다른 딜러의 입찰 금액은 공개되지 않습니다."
      );
    } catch (error) {
      console.error(
        "경매 입찰 실패:",
        error
      );

      setBidMessage(
        error?.response?.data
          ?.message ||
        error?.message ||
        "입찰 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsBidSubmitting(
        false
      );
    }
  }

  function handlePurchaseComplete() {
    if (!loginUser) {
      setTradeMessage(
        "로그인 후 구매할 수 있습니다."
      );

      return;
    }

    if (isOwner) {
      setTradeMessage(
        "본인이 등록한 차량은 구매할 수 없습니다."
      );

      return;
    }

    if (
      normalizedLoginRole !==
      AUTH_ROLES.MEMBER
    ) {
      setTradeMessage(
        "일반회원 계정만 딜러 매물을 구매할 수 있습니다."
      );

      return;
    }

    const buyerId =
      getLoginUserId(
        loginUser
      );

    if (!buyerId) {
      setTradeMessage(
        "로그인 사용자 정보를 확인할 수 없습니다."
      );

      return;
    }

    const trade =
      saveNormalTrade({
        id:
          `normal-${carId}-${buyerId}`,

        carId,
        carName,

        dealerId,
        dealerName:
          sellerName,

        companyId,
        companyName,

        buyerId,

        buyerName:
          getLoginUserName(
            loginUser
          ),

        price,

        status:
          "구매완료",

        completedAt:
          new Date().toISOString(),
      });

    setTradeMessage(
      `${trade.carName} 구매완료 처리되었습니다. 딜러 프로필에서 리뷰를 작성할 수 있습니다.`
    );
  }

  async function handleDeleteCar() {
    if (
      !isOwner ||
      isDeleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "이 매물을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setOwnerActionMessage(
        "매물을 삭제하고 있습니다."
      );

      await deleteCar(carId);

      window.alert(
        "매물이 삭제되었습니다."
      );

      navigate(
        isMemberCar
          ? "/member"
          : "/dealer/cars",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "차량 삭제 실패:",
        error
      );

      setOwnerActionMessage(
        error?.response?.data
          ?.message ||
        error?.message ||
        "매물 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMessageClick() {
    if (!loginUser) {
      setBidMessage(
        "로그인 후 판매자에게 문의할 수 있습니다."
      );
      setTradeMessage(
        "로그인 후 판매자에게 문의할 수 있습니다."
      );
      return;
    }

    if (isOwner) {
      setBidMessage(
        "본인이 등록한 차량에는 문의할 수 없습니다."
      );
      setTradeMessage(
        "본인이 등록한 차량에는 문의할 수 없습니다."
      );
      return;
    }

    if (
      normalizedLoginRole !== AUTH_ROLES.MEMBER ||
      !isDealerCar
    ) {
      const message =
        "일반회원만 딜러가 등록한 차량에 문의할 수 있습니다.";
      setBidMessage(message);
      setTradeMessage(message);
      return;
    }

    try {
      const room = await createOrGetChatRoom(carId);
      const messages = await getChatRoomMessages(
        room.roomId
      );

      if (!Array.isArray(messages) || messages.length === 0) {
        await sendChatMessage(
          room.roomId,
          `${carName} 차량 문의드립니다.`
        );
      }

      refreshMessageRooms();
      openMessageRoom(room.roomId);
      setTradeMessage("");
      setBidMessage("");
    } catch (error) {
      console.error("판매자 문의 채팅방 연결 실패:", error);
      const message =
        error?.message ||
        "문의 채팅방을 열지 못했습니다.";
      setBidMessage(message);
      setTradeMessage(message);
    }
  }

  return (
    <main className="car-detail-page">
      <div className="car-detail-top-menu">
        <Link
          to="/"
          className="back-link"
        >
          ← 차량 목록으로
        </Link>
      </div>

      <section className="car-detail-hero">
        <div className="car-detail-gallery">
          <div className="car-detail-image">
            {selectedImage ? (
              <img
                src={
                  selectedImage.imageUrl
                }
                alt={`${carName} 차량 이미지`}
              />
            ) : (
              <span>
                {car.imageText ||
                  "등록된 차량 이미지가 없습니다."}
              </span>
            )}
          </div>

          {carImages.length >
            1 && (
              <div className="car-detail-thumbnail-list">
                {carImages.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      key={
                        image.carImageId ||
                        image.id ||
                        `${image.imageUrl}-${index}`
                      }
                      type="button"
                      className={
                        selectedImageIndex ===
                          index
                          ? "car-detail-thumbnail active"
                          : "car-detail-thumbnail"
                      }
                      onClick={() =>
                        setSelectedImageIndex(
                          index
                        )
                      }
                      aria-label={`${index + 1}번째 차량 이미지 보기`}
                    >
                      <img
                        src={
                          image.imageUrl
                        }
                        alt={`${carName} 썸네일 ${index + 1}`}
                      />

                      {image.isMain ===
                        true && (
                          <span className="detail-main-image-badge">
                            대표
                          </span>
                        )}
                    </button>
                  )
                )}
              </div>
            )}
        </div>

        <div className="car-detail-summary">
          <div className="detail-status-row">
            <span
              className={`status-badge ${isAuctionDone
                ? "done"
                : ""
                }`}
            >
              {isAuctionCar
                ? auctionWinner
                  ? "낙찰완료"
                  : auctionStatus
                : car.status ||
                "판매중"}
            </span>

            <span className="seller-type-badge">
              {isDealerCar
                ? "회사딜러 매물"
                : "일반회원 경매 매물"}
            </span>
          </div>

          <h1>{carName}</h1>

          <p className="detail-sub-info">
            {car.year ||
              "연식 미등록"}
            년식 ·{" "}
            {mileage.toLocaleString()}
            km · {fuel} ·{" "}
            {region}
          </p>

          {isAuctionCar ? (
            <div className="detail-price-box auction-price-box">
              <span>
                경매 시작가
              </span>

              <strong>
                {Number(
                  auction.startPrice ||
                  0
                ).toLocaleString()}
                만원
              </strong>

              <p>
                비공개 입찰
                방식이라 다른
                입찰자의 금액은
                공개되지 않습니다.
              </p>
            </div>
          ) : (
            <div className="detail-price-box">
              <span>
                판매 가격
              </span>

              <strong>
                {price.toLocaleString()}
                만원
              </strong>

              <p>
                회사 소속 딜러가
                등록한 일반 판매
                차량입니다.
              </p>
            </div>
          )}

          <button
            type="button"
            className={`car-detail-wishlist-button ${isWished
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
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 21s-7.2-4.35-9.55-8.37C.45 9.2 1.43 5.1 5.08 3.75c2.22-.82 4.65-.08 5.92 1.67 1.27-1.75 3.7-2.49 5.92-1.67 3.65 1.35 4.63 5.45 2.63 8.88C19.2 16.65 12 21 12 21Z"
              />
            </svg>

            <span>
              {isWishlistLoading
                ? "처리 중"
                : isWished
                  ? "찜한 차량"
                  : "찜하기"}
            </span>
          </button>

          {isAuctionCar &&
            auctionWinner && (
              <div className="detail-auction-winner-box">
                <h3>
                  낙찰완료
                </h3>

                <p>
                  이 차량은 낙찰
                  처리가
                  완료되었습니다.
                  <br />

                  낙찰가:{" "}
                  <strong>
                    {Number(
                      auctionWinner.bidPrice ||
                      0
                    ).toLocaleString()}
                    만원
                  </strong>
                </p>
              </div>
            )}

          {isAuctionCar && (
            <div className="auction-summary-grid">
              <div>
                <span>
                  남은 시간
                </span>

                <strong>
                  {auctionWinner
                    ? "낙찰 처리 완료"
                    : remainText}
                </strong>
              </div>

              <div>
                <span>
                  입찰 수
                </span>

                <strong>
                  {totalBidCount}건
                </strong>
              </div>

              <div>
                <span>
                  입찰 시작일
                </span>

                <strong>
                  {formatDateTime(
                    auction.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  입찰 마감일
                </span>

                <strong>
                  {formatDateTime(
                    auction.endDate
                  )}
                </strong>
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="bid-form">
              <p className="bid-message">
                본인이 등록한 매물입니다.
              </p>

              {ownerActionMessage && (
                <p className="bid-message">
                  {ownerActionMessage}
                </p>
              )}

              <div className="detail-action-buttons">
                {isAuctionCar && (
                  <Link
                    to={ownerManagePath}
                    className="outline-button"
                  >
                    입찰 내역 관리
                  </Link>
                )}

                <Link
                  to={ownerEditPath}
                  className="outline-button"
                >
                  매물 수정
                </Link>

                <button
                  type="button"
                  onClick={handleDeleteCar}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "삭제 중..."
                    : "매물 삭제"}
                </button>
              </div>
            </div>
          ) : isAuctionCar ? (
            <form
              className="bid-form"
              onSubmit={
                handleBidSubmit
              }
            >
              <label htmlFor="bidPrice">
                입찰 금액
              </label>

              <div className="bid-input-row">
                <input
                  id="bidPrice"
                  type="number"
                  min={
                    auction.startPrice ||
                    0
                  }
                  step="10"
                  value={
                    bidPrice
                  }
                  onChange={(
                    event
                  ) =>
                    setBidPrice(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder={`${Number(
                    auction.startPrice ||
                    0
                  ).toLocaleString()}만원 이상`}
                  disabled={
                    !canPlaceBid ||
                    isBidSubmitting
                  }
                />

                <span>
                  만원
                </span>
              </div>

              {myBid && (
                <p className="my-bid-text">
                  내 입찰가:{" "}
                  {Number(
                    myBid.bidPrice
                  ).toLocaleString()}
                  만원
                </p>
              )}

              {auctionWinner && (
                <p className="bid-message">
                  낙찰이 완료된
                  차량이라 추가
                  입찰을 할 수
                  없습니다.
                </p>
              )}

              {bidMessage && (
                <p className="bid-message">
                  {bidMessage}
                </p>
              )}

              <div className="detail-action-buttons">
                <button
                  type="submit"
                  disabled={
                    !canPlaceBid ||
                    isBidSubmitting
                  }
                >
                  {isBidSubmitting
                    ? "입찰 처리 중..."
                    : myBid
                      ? "입찰 완료"
                      : "입찰하기"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {tradeMessage && (
                <p className="bid-message">
                  {
                    tradeMessage
                  }
                </p>
              )}

              <div className="detail-action-buttons">
                <button
                  type="button"
                  onClick={
                    handlePurchaseComplete
                  }
                  disabled={
                    normalizedLoginRole !==
                    AUTH_ROLES.MEMBER ||
                    isOwner ||
                    car.status ===
                    "판매완료"
                  }
                >
                  구매완료 테스트
                </button>

                {isDealerCar && (
                  <button
                    type="button"
                    className="outline-button"
                    onClick={
                      handleMessageClick
                    }
                  >
                    판매자 문의
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="car-detail-content">
        <section className="detail-panel">
          <h2>
            차량 기본 정보
          </h2>

          <div className="detail-info-grid">
            {detailItems.map(
              (item) => (
                <div
                  className="detail-info-item"
                  key={
                    item.label
                  }
                >
                  <span>
                    {item.label}
                  </span>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              )
            )}
          </div>
        </section>

        <section className="detail-panel">
          <h2>
            차량 설명
          </h2>

          <p className="detail-description">
            {car.description ||
              "등록된 차량 설명이 없습니다."}
          </p>
        </section>

        <section className="detail-panel">
          <h2>
            주요 옵션
          </h2>

          <div className="option-list">
            {optionList.length >
              0 ? (
              optionList.map(
                (option) => (
                  <span
                    key={
                      option
                    }
                  >
                    {option}
                  </span>
                )
              )
            ) : (
              <span>
                등록된 옵션 없음
              </span>
            )}
          </div>
        </section>

        <aside className="seller-panel">
          <h2>
            판매자 정보
          </h2>

          <div className="seller-info-list">
            <div>
              <span>
                판매자
              </span>

              {sellerId ? (
                <Link
                  to={
                    sellerProfilePath
                  }
                  className="seller-info-link"
                >
                  {sellerName}
                </Link>
              ) : (
                <strong>
                  {sellerName}
                </strong>
              )}
            </div>

            <div>
              <span>
                소속
              </span>

              {isDealerCar ? (
                <Link
                  to={
                    companyId
                      ? `/company/${companyId}`
                      : "/company"
                  }
                  className="seller-info-link"
                >
                  {companyName}
                </Link>
              ) : (
                <strong>
                  개인 판매
                </strong>
              )}
            </div>

            <div>
              <span>
                연락처
              </span>

              <strong>
                {sellerPhone}
              </strong>
            </div>

            <div>
              <span>
                거래 방식
              </span>

              <strong>
                {isNormalSaleCar
                  ? "일반 중고거래"
                  : "기간제 비공개 입찰"}
              </strong>
            </div>
          </div>

          {!isOwner && isDealerCar && (
            <button
              type="button"
              onClick={
                handleMessageClick
              }
            >
              판매자에게 문의
            </button>
          )}

          {isOwner && (
            <Link
              to={ownerManagePath}
              className="seller-info-link"
            >
              내 매물 관리
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}

export default CarDetailPage;