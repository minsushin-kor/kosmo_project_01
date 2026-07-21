import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  companyDealers,
} from "../../data/companyData";
import {
  AUTH_ROLES,
  setAuthUser,
} from "../../data/authUser";
import {
  useAuth,
} from "../../hooks/useAuth";
import CarCard from "../../components/car/CarCard";
import {
  getAllCars,
} from "../../utils/carViewUtils";
import {
  getReviewsByDealerId,
  saveDealerReview,
} from "../../utils/dealerReviewStorage";
import {
  getReviewableTrades,
} from "../../utils/normalTradeStorage";
import "../../css/common/page.css";
import "../../css/company/dealerPage.css";

const DEALER_PROFILE_STORAGE_KEY =
  "car_front_dealer_profiles";

function getDealerProfiles() {
  const savedProfiles =
    localStorage.getItem(
      DEALER_PROFILE_STORAGE_KEY
    );

  if (!savedProfiles) {
    return {};
  }

  try {
    return JSON.parse(
      savedProfiles
    );
  } catch (error) {
    console.error(
      "딜러 개인정보 불러오기 실패:",
      error
    );

    return {};
  }
}

function getDealerProfile(
  dealerId
) {
  const profiles =
    getDealerProfiles();

  return (
    profiles[String(dealerId)] ||
    {}
  );
}

function saveDealerProfile(
  dealerId,
  profile
) {
  const profiles =
    getDealerProfiles();

  profiles[String(dealerId)] = {
    ...profiles[
    String(dealerId)
    ],
    ...profile,
    updatedAt:
      new Date().toISOString(),
  };

  localStorage.setItem(
    DEALER_PROFILE_STORAGE_KEY,
    JSON.stringify(profiles)
  );

  window.dispatchEvent(
    new Event(
      "dealer-profile-change"
    )
  );

  return profiles[
    String(dealerId)
  ];
}

function formatDate(dateText) {
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

  return date.toLocaleDateString(
    "ko-KR"
  );
}

function DealerPage() {
  const {
    dealerId: routeDealerId,
  } = useParams();

  const {
    loginUser,
  } = useAuth();

  const dealerId = Number(
    routeDealerId ||
    loginUser?.dealerId ||
    loginUser?.id ||
    1
  );

  const loginDealerId =
    Number(
      loginUser?.dealerId ||
      loginUser?.id
    );

  const isOwnPage =
    loginUser?.role ===
    AUTH_ROLES.DEALER &&
    loginDealerId === dealerId;

  const [
    savedProfile,
    setSavedProfile,
  ] = useState(() =>
    getDealerProfile(
      dealerId
    )
  );

  const [
    isProfileEditing,
    setIsProfileEditing,
  ] = useState(false);

  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    task: "",
    activityRegion: "",
    introduction: "",
  });

  const [
    profileMessage,
    setProfileMessage,
  ] = useState("");

  const [
    carViewState,
    setCarViewState,
  ] = useState(() => ({
    dealerId,
    view: "all",
  }));

  const selectedCarView =
    carViewState.dealerId ===
      dealerId
      ? carViewState.view
      : "all";

  function setSelectedCarView(
    view
  ) {
    setCarViewState({
      dealerId,
      view,
    });
  }

  const carSectionRef =
    useRef(null);

  const dealerCars = useMemo(
    () =>
      getAllCars().filter(
        (car) =>
          Number(
            car.dealerId
          ) === dealerId
      ),
    [dealerId]
  );

  const soldCars = useMemo(
    () =>
      dealerCars.filter(
        (car) =>
          car.status ===
          "판매완료" ||
          car.status ===
          "거래완료"
      ),
    [dealerCars]
  );

  const visibleDealerCars =
    useMemo(() => {
      if (
        selectedCarView ===
        "sold"
      ) {
        return soldCars;
      }

      return dealerCars;
    }, [
      dealerCars,
      selectedCarView,
      soldCars,
    ]);

  const dealer =
    useMemo(() => {
      const savedDealer =
        companyDealers.find(
          (item) =>
            Number(item.id) ===
            dealerId
        );

      const dealerCar =
        dealerCars[0];

      return {
        id: dealerId,

        name:
          savedProfile.name ||
          savedDealer?.name ||
          dealerCar?.sellerName ||
          (
            isOwnPage
              ? loginUser?.name
              : ""
          ) ||
          `딜러 ${dealerId}`,

        phone:
          savedProfile.phone ||
          savedDealer?.phone ||
          dealerCar?.sellerPhone ||
          (
            isOwnPage
              ? loginUser?.phone
              : ""
          ) ||
          "-",

        email:
          savedProfile.email ||
          savedDealer?.email ||
          (
            isOwnPage
              ? loginUser?.email
              : ""
          ) ||
          "-",

        position:
          savedProfile.position ||
          savedDealer?.position ||
          (
            isOwnPage
              ? loginUser?.position
              : ""
          ) ||
          "딜러",

        task:
          savedProfile.task ||
          savedDealer?.task ||
          (
            isOwnPage
              ? loginUser?.task
              : ""
          ) ||
          "중고차 상담 및 판매",

        activityRegion:
          savedProfile
            .activityRegion ||
          savedDealer
            ?.activityRegion ||
          dealerCar?.region ||
          (
            isOwnPage
              ? loginUser
                ?.activityRegion
              : ""
          ) ||
          "서울특별시",

        introduction:
          savedProfile
            .introduction ||
          savedDealer
            ?.introduction ||
          (
            isOwnPage
              ? loginUser
                ?.introduction
              : ""
          ) ||
          "차량 상태를 정확하게 안내하고 안전한 거래를 진행하겠습니다.",

        profileImage:
          savedProfile
            .profileImage ||
          savedDealer
            ?.profileImage ||
          (
            isOwnPage
              ? loginUser
                ?.profileImage
              : ""
          ) ||
          "",

        companyId:
          dealerCar?.companyId ||
          savedDealer?.companyId ||
          (
            isOwnPage
              ? loginUser
                ?.companyId
              : ""
          ) ||
          1,

        companyName:
          dealerCar
            ?.companyName ||
          savedDealer
            ?.companyName ||
          (
            isOwnPage
              ? loginUser
                ?.companyName
              : ""
          ) ||
          "Kosmo 인증모터스",

        joinDate:
          savedDealer?.joinDate ||
          (
            isOwnPage
              ? loginUser
                ?.joinDate
              : ""
          ) ||
          "2026-07-01",

        carCount:
          dealerCars.length,

        soldCount:
          soldCars.length,
      };
    }, [
      dealerCars,
      dealerId,
      isOwnPage,
      loginUser,
      savedProfile,
      soldCars.length,
    ]);

  const [
    reviews,
    setReviews,
  ] = useState(() =>
    getReviewsByDealerId(
      dealerId
    )
  );

  const [
    selectedTradeId,
    setSelectedTradeId,
  ] = useState("");

  const [
    rating,
    setRating,
  ] = useState(5);

  const [
    content,
    setContent,
  ] = useState("");

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  useEffect(() => {
    function loadProfile() {
      setSavedProfile(
        getDealerProfile(
          dealerId
        )
      );
    }

    loadProfile();

    window.addEventListener(
      "dealer-profile-change",
      loadProfile
    );

    return () => {
      window.removeEventListener(
        "dealer-profile-change",
        loadProfile
      );
    };
  }, [dealerId]);


  useEffect(() => {
    function loadReviews() {
      setReviews(
        getReviewsByDealerId(
          dealerId
        )
      );
    }

    loadReviews();

    window.addEventListener(
      "dealer-review-change",
      loadReviews
    );

    return () => {
      window.removeEventListener(
        "dealer-review-change",
        loadReviews
      );
    };
  }, [dealerId]);

  useEffect(() => {
    if (
      !isProfileEditing
    ) {
      return undefined;
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsProfileEditing(
          false
        );

        setProfileMessage("");
      }
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isProfileEditing]);

  const reviewableTrades = (() => {
    if (
      loginUser?.role !==
      AUTH_ROLES.MEMBER
    ) {
      return [];
    }

    const writtenTradeIds =
      new Set(
        reviews
          .filter(
            (review) =>
              Number(
                review.memberId
              ) ===
              Number(
                loginUser.id
              )
          )
          .map((review) =>
            String(
              review.tradeId
            )
          )
      );

    return getReviewableTrades(
      loginUser.id,
      dealerId
    ).filter(
      (trade) =>
        !writtenTradeIds.has(
          String(trade.id)
        )
    );
  })();

  const averageRating =
    useMemo(() => {
      if (
        reviews.length === 0
      ) {
        return 0;
      }

      const ratingTotal =
        reviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.rating
            ),
          0
        );

      return (
        ratingTotal /
        reviews.length
      );
    }, [reviews]);

  function handleCarViewChange(
    view
  ) {
    setSelectedCarView(
      view
    );

    window.requestAnimationFrame(
      () => {
        carSectionRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }
    );
  }

  function handleProfileEditOpen() {
    setProfileForm({
      name:
        dealer.name || "",

      phone:
        dealer.phone === "-"
          ? ""
          : dealer.phone,

      email:
        dealer.email === "-"
          ? ""
          : dealer.email,

      position:
        dealer.position || "",

      task:
        dealer.task || "",

      activityRegion:
        dealer.activityRegion ||
        "",

      introduction:
        dealer.introduction ||
        "",
    });

    setProfileMessage("");

    setIsProfileEditing(
      true
    );
  }

  function handleProfileEditCancel() {
    setIsProfileEditing(
      false
    );

    setProfileMessage("");
  }

  function handleProfileChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setProfileForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  function handleProfileSubmit(
    event
  ) {
    event.preventDefault();

    if (!isOwnPage) {
      setProfileMessage(
        "본인의 개인정보만 수정할 수 있습니다."
      );

      return;
    }

    const nextName =
      profileForm.name.trim();

    const nextPhone =
      profileForm.phone.trim();

    const nextEmail =
      profileForm.email.trim();

    if (!nextName) {
      setProfileMessage(
        "이름을 입력해주세요."
      );

      return;
    }

    if (!nextPhone) {
      setProfileMessage(
        "연락처를 입력해주세요."
      );

      return;
    }

    if (!nextEmail) {
      setProfileMessage(
        "이메일을 입력해주세요."
      );

      return;
    }

    const nextProfile = {
      name: nextName,
      phone: nextPhone,
      email: nextEmail,

      position:
        profileForm
          .position
          .trim() ||
        "딜러",

      task:
        profileForm
          .task
          .trim() ||
        "중고차 상담 및 판매",

      activityRegion:
        profileForm
          .activityRegion
          .trim() ||
        "서울특별시",

      introduction:
        profileForm
          .introduction
          .trim() ||
        "차량 상태를 정확하게 안내하고 안전한 거래를 진행하겠습니다.",

      profileImage:
        savedProfile
          .profileImage ||
        loginUser
          ?.profileImage ||
        "",
    };

    const saved =
      saveDealerProfile(
        dealerId,
        nextProfile
      );

    setSavedProfile(saved);

    setAuthUser({
      ...loginUser,
      ...nextProfile,
    });

    setIsProfileEditing(
      false
    );

    setProfileMessage(
      "개인정보가 수정되었습니다."
    );
  }

  function handleReviewSubmit(
    event
  ) {
    event.preventDefault();

    if (!selectedTradeId) {
      setReviewMessage(
        "리뷰를 작성할 구매완료 차량을 선택해주세요."
      );

      return;
    }

    if (!content.trim()) {
      setReviewMessage(
        "리뷰 내용을 입력해주세요."
      );

      return;
    }

    const trade =
      reviewableTrades.find(
        (item) =>
          String(item.id) ===
          String(
            selectedTradeId
          )
      );

    if (!trade) {
      setReviewMessage(
        "구매 거래 정보를 찾을 수 없습니다."
      );

      return;
    }

    try {
      saveDealerReview({
        id: crypto.randomUUID(),

        tradeId:
          trade.id,

        carId:
          trade.carId,

        carName:
          trade.carName,

        dealerId,

        dealerName:
          dealer.name,

        memberId:
          loginUser.id,

        memberName:
          loginUser.name,

        rating:
          Number(rating),

        content:
          content.trim(),

        createdAt:
          new Date()
            .toISOString(),
      });

      setSelectedTradeId("");
      setRating(5);
      setContent("");

      setReviewMessage(
        "리뷰가 등록되었습니다."
      );
    } catch (error) {
      setReviewMessage(
        error.message
      );
    }
  }

  return (
    <main className="page-container dealer-profile-page">
      <section className="page-section dealer-profile-section">
        <div className="dealer-profile-top">
          <div className="dealer-profile-avatar">
            {dealer.profileImage ? (
              <img
                src={
                  dealer.profileImage
                }
                alt={`${dealer.name} 프로필`}
              />
            ) : (
              <span>
                {dealer.name
                  .slice(0, 1)}
              </span>
            )}
          </div>

          <div className="dealer-profile-main">
            <Link
              to={`/companies/${dealer.companyId}`}
              className="dealer-profile-company-link"
            >
              {dealer.companyName}
            </Link>

            <div className="dealer-profile-name-row">
              <div className="dealer-profile-name-box">
                <h1>
                  {dealer.name}
                </h1>

                <span className="dealer-position-badge">
                  {dealer.position}
                </span>
              </div>

              {isOwnPage && (
                <button
                  type="button"
                  className="dealer-profile-edit-btn"
                  onClick={
                    handleProfileEditOpen
                  }
                >
                  개인정보 수정
                </button>
              )}
            </div>

            <p className="dealer-profile-contact">
              {dealer.phone}
              {" · "}
              {dealer.email}
            </p>
          </div>

          <div className="dealer-profile-rating">
            <span>
              구매자 평점
            </span>

            <strong>
              {averageRating
                ? averageRating.toFixed(
                  1
                )
                : "-"}
            </strong>

            <small>
              리뷰 {reviews.length}개
            </small>
          </div>
        </div>

        <div className="dealer-profile-divider" />

        <div className="dealer-profile-detail-grid">
          <article>
            <span>
              소속회사
            </span>

            <Link
              to={`/companies/${dealer.companyId}`}
            >
              {dealer.companyName}
            </Link>
          </article>

          <article>
            <span>
              직급
            </span>

            <strong>
              {dealer.position}
            </strong>
          </article>

          <article>
            <span>
              담당업무
            </span>

            <strong>
              {dealer.task}
            </strong>
          </article>

          <article>
            <span>
              활동지역
            </span>

            <strong>
              {dealer.activityRegion}
            </strong>
          </article>
        </div>

        <div className="dealer-profile-introduction">
          <span>
            딜러 소개
          </span>

          <p>
            {dealer.introduction}
          </p>
        </div>

        <div className="dealer-profile-stat-grid">
          <button
            type="button"
            className={
              selectedCarView ===
                "all"
                ? "active"
                : ""
            }
            onClick={() =>
              handleCarViewChange(
                "all"
              )
            }
          >
            <span>
              등록 매물
            </span>

            <strong>
              {dealer.carCount}대
            </strong>

            <small>
              등록 매물 상세보기
            </small>
          </button>

          <button
            type="button"
            className={
              selectedCarView ===
                "sold"
                ? "active"
                : ""
            }
            onClick={() =>
              handleCarViewChange(
                "sold"
              )
            }
          >
            <span>
              판매 완료
            </span>

            <strong>
              {dealer.soldCount}대
            </strong>

            <small>
              판매 완료 상세보기
            </small>
          </button>

          <article>
            <span>
              활동 시작일
            </span>

            <strong>
              {formatDate(
                dealer.joinDate
              )}
            </strong>

            <small>
              딜러 활동 정보
            </small>
          </article>
        </div>

        {profileMessage && (
          <p className="dealer-profile-save-message">
            {profileMessage}
          </p>
        )}
      </section>

      <section
        ref={carSectionRef}
        className="page-section dealer-car-section"
      >
        <div className="dealer-section-header">
          <div>
            <h2>
              {selectedCarView ===
                "sold"
                ? "판매 완료 매물"
                : "등록 매물"}
            </h2>

            <p>
              {selectedCarView ===
                "sold"
                ? "딜러가 판매를 완료한 차량입니다."
                : "현재 딜러가 등록한 판매 차량입니다."}
            </p>
          </div>

          <div className="dealer-car-section-actions">
            <div className="dealer-car-view-buttons">
              <button
                type="button"
                className={
                  selectedCarView ===
                    "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedCarView(
                    "all"
                  )
                }
              >
                등록 매물{" "}
                {dealerCars.length}
              </button>

              <button
                type="button"
                className={
                  selectedCarView ===
                    "sold"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedCarView(
                    "sold"
                  )
                }
              >
                판매 완료{" "}
                {soldCars.length}
              </button>
            </div>

            {isOwnPage && (
              <div className="page-action-buttons">
                <Link to="/dealer/cars">
                  내 매물 관리
                </Link>

                <Link to="/dealer/register-car">
                  매물 등록
                </Link>
              </div>
            )}
          </div>
        </div>

        {visibleDealerCars.length ===
          0 ? (
          <div className="dealer-car-empty">
            {selectedCarView ===
              "sold"
              ? "판매 완료된 매물이 없습니다."
              : "등록된 매물이 없습니다."}
          </div>
        ) : (
          <div className="dealer-public-car-grid">
            {visibleDealerCars.map(
              (car) => (
                <CarCard
                  key={car.id}
                  car={car}
                />
              )
            )}
          </div>
        )}
      </section>

      {loginUser?.role ===
        AUTH_ROLES.MEMBER &&
        reviewableTrades.length >
        0 && (
          <section className="page-section dealer-review-write-section">
            <h2>
              구매 리뷰 작성
            </h2>

            <p>
              구매완료 처리된 차량만
              거래당 한 번 리뷰를
              작성할 수 있습니다.
            </p>

            <form
              className="dealer-review-form"
              onSubmit={
                handleReviewSubmit
              }
            >
              <label>
                구매 차량

                <select
                  value={
                    selectedTradeId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedTradeId(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    차량 선택
                  </option>

                  {reviewableTrades.map(
                    (trade) => (
                      <option
                        key={
                          trade.id
                        }
                        value={
                          trade.id
                        }
                      >
                        {
                          trade.carName
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                평점

                <select
                  value={rating}
                  onChange={(
                    event
                  ) =>
                    setRating(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                >
                  {[5, 4, 3, 2, 1].map(
                    (score) => (
                      <option
                        key={score}
                        value={score}
                      >
                        {score}점
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="dealer-review-content-field">
                리뷰 내용

                <textarea
                  value={content}
                  onChange={(
                    event
                  ) =>
                    setContent(
                      event.target
                        .value
                    )
                  }
                  maxLength={500}
                  placeholder="차량 상태와 딜러 응대에 대한 리뷰를 작성해주세요."
                />
              </label>

              <button type="submit">
                리뷰 등록
              </button>
            </form>

            {reviewMessage && (
              <p className="dealer-review-message">
                {reviewMessage}
              </p>
            )}
          </section>
        )}

      <section className="page-section dealer-review-section">
        <div className="dealer-review-title-row">
          <div>
            <h2>
              구매자 리뷰
            </h2>

            <p>
              일반회원이 실제 구매완료
              거래 후 작성한
              리뷰입니다.
            </p>
          </div>

          <strong>
            {reviews.length}개
          </strong>
        </div>

        {reviews.length === 0 ? (
          <div className="dealer-review-empty">
            아직 등록된 리뷰가
            없습니다.
          </div>
        ) : (
          <div className="dealer-review-list">
            {reviews.map(
              (review) => (
                <article
                  key={review.id}
                  className="dealer-review-card"
                >
                  <div className="dealer-review-card-header">
                    <div>
                      <strong>
                        {
                          review.memberName
                        }
                      </strong>

                      <span>
                        {
                          review.carName
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        {"★".repeat(
                          Number(
                            review.rating
                          )
                        )}

                        {"☆".repeat(
                          5 -
                          Number(
                            review.rating
                          )
                        )}
                      </strong>

                      <span>
                        {formatDate(
                          review.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <p>
                    {review.content}
                  </p>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {isProfileEditing &&
        isOwnPage && (
          <div
            className="dealer-profile-modal-backdrop"
            onMouseDown={
              handleProfileEditCancel
            }
          >
            <section
              className="dealer-profile-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="dealer-profile-modal-header">
                <div>
                  <h2>
                    딜러 개인정보 수정
                  </h2>

                  <p>
                    공개페이지와 계정에
                    표시되는 정보를
                    수정합니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleProfileEditCancel
                  }
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>

              <form
                className="dealer-profile-edit-form"
                onSubmit={
                  handleProfileSubmit
                }
              >
                <div className="dealer-profile-form-grid">
                  <label>
                    이름

                    <input
                      type="text"
                      name="name"
                      value={
                        profileForm.name
                      }
                      onChange={
                        handleProfileChange
                      }
                    />
                  </label>

                  <label>
                    연락처

                    <input
                      type="text"
                      name="phone"
                      value={
                        profileForm.phone
                      }
                      onChange={
                        handleProfileChange
                      }
                    />
                  </label>

                  <label>
                    이메일

                    <input
                      type="email"
                      name="email"
                      value={
                        profileForm.email
                      }
                      onChange={
                        handleProfileChange
                      }
                    />
                  </label>

                  <label>
                    직급

                    <input
                      type="text"
                      name="position"
                      value={
                        profileForm
                          .position
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="예: 대리"
                    />
                  </label>

                  <label>
                    담당업무

                    <input
                      type="text"
                      name="task"
                      value={
                        profileForm.task
                      }
                      onChange={
                        handleProfileChange
                      }
                      placeholder="예: 중고차 상담 및 판매"
                    />
                  </label>

                  <label>
                    활동지역

                    <select
                      name="activityRegion"
                      value={
                        profileForm
                          .activityRegion
                      }
                      onChange={
                        handleProfileChange
                      }
                    >
                      <option value="">
                        지역 선택
                      </option>

                      <option value="서울특별시">
                        서울특별시
                      </option>

                      <option value="부산광역시">
                        부산광역시
                      </option>

                      <option value="대구광역시">
                        대구광역시
                      </option>

                      <option value="인천광역시">
                        인천광역시
                      </option>

                      <option value="광주광역시">
                        광주광역시
                      </option>

                      <option value="대전광역시">
                        대전광역시
                      </option>

                      <option value="울산광역시">
                        울산광역시
                      </option>

                      <option value="세종특별자치시">
                        세종특별자치시
                      </option>

                      <option value="경기도">
                        경기도
                      </option>

                      <option value="강원특별자치도">
                        강원특별자치도
                      </option>

                      <option value="충청북도">
                        충청북도
                      </option>

                      <option value="충청남도">
                        충청남도
                      </option>

                      <option value="전북특별자치도">
                        전북특별자치도
                      </option>

                      <option value="전라남도">
                        전라남도
                      </option>

                      <option value="경상북도">
                        경상북도
                      </option>

                      <option value="경상남도">
                        경상남도
                      </option>

                      <option value="제주특별자치도">
                        제주특별자치도
                      </option>
                    </select>
                  </label>
                </div>

                <label className="dealer-profile-introduction-field">
                  소개

                  <textarea
                    name="introduction"
                    value={
                      profileForm
                        .introduction
                    }
                    onChange={
                      handleProfileChange
                    }
                    maxLength={500}
                    placeholder="딜러 소개를 입력해주세요."
                  />
                </label>

                {profileMessage && (
                  <p className="dealer-profile-form-message">
                    {profileMessage}
                  </p>
                )}

                <div className="dealer-profile-form-actions">
                  <button
                    type="button"
                    className="dealer-profile-cancel-btn"
                    onClick={
                      handleProfileEditCancel
                    }
                  >
                    취소
                  </button>

                  <button
                    type="submit"
                    className="dealer-profile-save-btn"
                  >
                    수정 완료
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
    </main>
  );
}

export default DealerPage;