import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import {
  AUTH_ROLES,
  getRoleName,
  setAuthUser,
} from "../../data/authUser";
import {
  getMyPageMenusByRole,
} from "../../data/myPageMenuData";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  updateMemberProfile,
} from "../../api/myPageApi";
import {
  getMyCars,
} from "../../api/carApi";
import {
  getMyWishlists,
  WISHLIST_CHANGE_EVENT,
} from "../../api/wishlistApi";
import "../../css/member/myPage.css";

function resolveCarImage(car) {
  const images =
    Array.isArray(
      car?.images
    )
      ? car.images
      : [];

  const mainImage =
    images.find(
      (image) =>
        image?.isMain ===
        true
    );

  return (
    car?.imageUrl ||
    mainImage?.imageUrl ||
    images[0]?.imageUrl ||
    car?.image ||
    car?.thumbnailUrl ||
    car?.previewUrl ||
    images[0]?.previewUrl ||
    images[0]?.url ||
    ""
  );
}

function getOwnedCarName(car) {
  if (!car) {
    return "보유차량 없음";
  }

  const generatedName = [
    car.brand ||
    car.make ||
    "",
    car.modelName ||
    car.model ||
    "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    car.carName ||
    generatedName ||
    "차량명 없음"
  );
}

function getCarName(car) {
  const generatedName = [
    car?.brand ||
    car?.make ||
    "",
    car?.modelName ||
    car?.model ||
    "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    car?.carName ||
    generatedName ||
    "차량"
  );
}

function getCarId(car) {
  return (
    car?.carId ||
    car?.id ||
    null
  );
}

function getCarMileage(car) {
  const mileage =
    Number(
      car?.mileage ??
      car?.odometer ??
      0
    );

  return Number.isFinite(
    mileage
  )
    ? mileage
    : 0;
}

function getCarPrice(car) {
  const price =
    Number(
      car?.auction
        ?.startPrice ??
      car?.startPrice ??
      car?.sellingPrice ??
      car?.sellingprice ??
      car?.price ??
      0
    );

  return Number.isFinite(
    price
  )
    ? price
    : 0;
}

function getAuctionStatus(car) {
  return (
    car?.auction?.status ||
    car?.auctionStatus ||
    car?.status ||
    "경매중"
  );
}

function createMemberEditForm(
  loginUser
) {
  return {
    name:
      loginUser?.name || "",

    email:
      loginUser?.email || "",

    phone:
      loginUser?.phone || "",

    hasCar:
      Boolean(
        loginUser?.hasCar
      ),

    ownedCarMake:
      loginUser
        ?.ownedCarMake ||
      "",

    ownedCarModel:
      loginUser
        ?.ownedCarModel ||
      "",

    ownedCarYear:
      loginUser
        ?.ownedCarYear ??
      "",

    ownedCarOdometer:
      loginUser
        ?.ownedCarOdometer ??
      "",
  };
}

function MyPage() {
  const {
    loginUser,
  } = useAuth();

  const [
    selectedOwnedCar,
    setSelectedOwnedCar,
  ] = useState(null);

  const [
    isMemberEditOpen,
    setIsMemberEditOpen,
  ] = useState(false);

  const [
    memberEditForm,
    setMemberEditForm,
  ] = useState(() =>
    createMemberEditForm(
      loginUser
    )
  );

  const [
    memberEditMessage,
    setMemberEditMessage,
  ] = useState("");

  const [
    isMemberEditSubmitting,
    setIsMemberEditSubmitting,
  ] = useState(false);

  const [
    registeredAuctionCars,
    setRegisteredAuctionCars,
  ] = useState([]);

  /*
   * effect 안에서 로딩 상태를 즉시 true로 변경하지 않도록
   * 최초 상태를 true로 설정합니다.
   */
  const [
    isMyCarsLoading,
    setIsMyCarsLoading,
  ] = useState(true);

  const [
    myCarsError,
    setMyCarsError,
  ] = useState("");

  const [
    favoriteCars,
    setFavoriteCars,
  ] = useState([]);

  const [
    isFavoriteCarsLoading,
    setIsFavoriteCarsLoading,
  ] = useState(true);

  const [
    favoriteCarsError,
    setFavoriteCarsError,
  ] = useState("");

  const isMember =
    loginUser?.role ===
    AUTH_ROLES.MEMBER;

  const isDealer =
    loginUser?.role ===
    AUTH_ROLES.DEALER;

  const myPageMenus =
    loginUser
      ? getMyPageMenusByRole(
        loginUser.role
      )
      : [];

  const ownedCars =
    Array.isArray(
      loginUser?.ownedCars
    )
      ? loginUser.ownedCars
      : [];

  const firstOwnedCar =
    ownedCars[0] || null;


  const inquiryList =
    useMemo(
      () => [
        {
          id: 1,
          carId: 1,
          carName:
            "현대 아반떼 CN7 1호 매물",
          content:
            "방문해서 차량 확인 가능한가요?",
          inquiryStatus:
            "답변대기",
          saleStatus:
            "판매중",
        },
        {
          id: 2,
          carId: 2,
          carName:
            "기아 K5 3세대 1호 매물",
          content:
            "사고 이력 확인 가능할까요?",
          inquiryStatus:
            "답변완료",
          saleStatus:
            "판매중",
        },
      ],
      []
    );

  function openMemberEditModal() {
    setMemberEditForm(
      createMemberEditForm(
        loginUser
      )
    );

    setMemberEditMessage("");
    setIsMemberEditOpen(true);
  }

  function closeMemberEditModal() {
    if (
      isMemberEditSubmitting
    ) {
      return;
    }

    setIsMemberEditOpen(false);
    setMemberEditMessage("");
  }

  function handleMemberEditChange(
    event
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setMemberEditForm(
      (prev) => ({
        ...prev,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  }

  async function handleMemberEditSubmit(
    event
  ) {
    event.preventDefault();

    if (
      isMemberEditSubmitting
    ) {
      return;
    }

    const name =
      memberEditForm.name.trim();

    const email =
      memberEditForm.email.trim();

    const phone =
      memberEditForm.phone.trim();

    if (!name) {
      setMemberEditMessage(
        "이름을 입력해주세요."
      );

      return;
    }

    if (!email) {
      setMemberEditMessage(
        "이메일을 입력해주세요."
      );

      return;
    }

    if (!phone) {
      setMemberEditMessage(
        "연락처를 입력해주세요."
      );

      return;
    }

    const ownedCarMake =
      memberEditForm
        .ownedCarMake
        .trim();

    const ownedCarModel =
      memberEditForm
        .ownedCarModel
        .trim();

    if (
      memberEditForm.hasCar &&
      !ownedCarMake
    ) {
      setMemberEditMessage(
        "자차 제조사를 입력해주세요."
      );

      return;
    }

    if (
      memberEditForm.hasCar &&
      !ownedCarModel
    ) {
      setMemberEditMessage(
        "자차 모델을 입력해주세요."
      );

      return;
    }

    const ownedCarYear =
      memberEditForm
        .ownedCarYear === ""
        ? null
        : Number(
          memberEditForm
            .ownedCarYear
        );

    const ownedCarOdometer =
      memberEditForm
        .ownedCarOdometer === ""
        ? null
        : Number(
          memberEditForm
            .ownedCarOdometer
        );

    if (
      ownedCarYear !==
      null &&
      (
        !Number.isInteger(
          ownedCarYear
        ) ||
        ownedCarYear < 1900
      )
    ) {
      setMemberEditMessage(
        "자차 연식을 확인해주세요."
      );

      return;
    }

    if (
      ownedCarOdometer !==
      null &&
      (
        !Number.isFinite(
          ownedCarOdometer
        ) ||
        ownedCarOdometer <
        0
      )
    ) {
      setMemberEditMessage(
        "주행거리는 0 이상이어야 합니다."
      );

      return;
    }

    try {
      setIsMemberEditSubmitting(
        true
      );

      setMemberEditMessage("");

      const updatedProfile =
        await updateMemberProfile({
          name,
          email,
          phone,

          hasCar:
            memberEditForm.hasCar,

          ownedCarImageUrl:
            memberEditForm.hasCar
              ? loginUser
                ?.ownedCarImageUrl ||
              null
              : null,

          ownedCarMake:
            memberEditForm.hasCar
              ? ownedCarMake
              : null,

          ownedCarModel:
            memberEditForm.hasCar
              ? ownedCarModel
              : null,

          ownedCarYear:
            memberEditForm.hasCar
              ? ownedCarYear
              : null,

          ownedCarOdometer:
            memberEditForm.hasCar
              ? ownedCarOdometer
              : null,
        });

      const nextOwnedCars =
        updatedProfile.hasCar
          ? [
            {
              id:
                updatedProfile
                  .memberId ||
                updatedProfile
                  .userId ||
                1,

              brand:
                updatedProfile
                  .ownedCarMake ||
                "",

              modelName:
                updatedProfile
                  .ownedCarModel ||
                "",

              carName: [
                updatedProfile
                  .ownedCarMake,
                updatedProfile
                  .ownedCarModel,
              ]
                .filter(
                  Boolean
                )
                .join(" "),

              year:
                updatedProfile
                  .ownedCarYear ??
                null,

              mileage:
                updatedProfile
                  .ownedCarOdometer ??
                null,

              imageUrl:
                updatedProfile
                  .ownedCarImageUrl ||
                "",

              carNumber: "",
              fuel: "",
              transmission: "",
              color: "",
            },
          ]
          : [];

      setAuthUser({
        ...loginUser,

        name:
          updatedProfile.name,

        email:
          updatedProfile.email,

        phone:
          updatedProfile.phone,

        hasCar:
          Boolean(
            updatedProfile.hasCar
          ),

        ownedCarImageUrl:
          updatedProfile
            .ownedCarImageUrl ||
          "",

        ownedCarMake:
          updatedProfile
            .ownedCarMake ||
          "",

        ownedCarModel:
          updatedProfile
            .ownedCarModel ||
          "",

        ownedCarYear:
          updatedProfile
            .ownedCarYear ??
          null,

        ownedCarOdometer:
          updatedProfile
            .ownedCarOdometer ??
          null,

        ownedCars:
          nextOwnedCars,
      });

      setIsMemberEditOpen(
        false
      );

      alert(
        "회원정보가 수정되었습니다."
      );
    } catch (error) {
      console.error(
        "회원정보 수정 실패:",
        error
      );

      setMemberEditMessage(
        error?.message ||
        "회원정보 수정 중 오류가 발생했습니다."
      );
    } finally {
      setIsMemberEditSubmitting(
        false
      );
    }
  }

  /*
   * 일반회원일 때만 내 등록 차량을 조회합니다.
   *
   * effect 본문에서는 setState를 직접 호출하지 않고,
   * Promise 완료 콜백에서 상태를 갱신합니다.
   */
  useEffect(() => {
    if (!isMember) {
      return undefined;
    }

    let isMounted = true;

    getMyCars()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        const carList =
          Array.isArray(result)
            ? result
            : [];

        const memberAuctionCars =
          carList.filter(
            (car) =>
              car.saleType ===
              "AUCTION" ||
              car.ownerType ===
              "MEMBER" ||
              (
                Boolean(
                  car.memberId
                ) &&
                !car.dealerId
              )
          );

        setRegisteredAuctionCars(
          memberAuctionCars
        );

        setMyCarsError("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error(
          "내 등록 차량 조회 실패:",
          error
        );

        setRegisteredAuctionCars(
          []
        );

        setMyCarsError(
          error?.message ||
          "등록 차량을 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (
          !isMounted
        ) {
          return;
        }

        setIsMyCarsLoading(
          false
        );
      });

    return () => {
      isMounted = false;
    };
  }, [isMember]);

  useEffect(() => {
    if (!isMember) {
      return undefined;
    }

    let isMounted = true;

    function loadFavoriteCars() {
      getMyWishlists()
        .then((result) => {
          if (!isMounted) {
            return;
          }

          setFavoriteCars(
            Array.isArray(result)
              ? result
              : []
          );

          setFavoriteCarsError(
            ""
          );
        })
        .catch((error) => {
          if (!isMounted) {
            return;
          }

          console.error(
            "관심 차량 조회 실패:",
            error
          );

          setFavoriteCars([]);
          setFavoriteCarsError(
            error?.message ||
            "관심 차량을 불러오지 못했습니다."
          );
        })
        .finally(() => {
          if (!isMounted) {
            return;
          }

          setIsFavoriteCarsLoading(
            false
          );
        });
    }

    loadFavoriteCars();

    window.addEventListener(
      WISHLIST_CHANGE_EVENT,
      loadFavoriteCars
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        WISHLIST_CHANGE_EVENT,
        loadFavoriteCars
      );
    };
  }, [isMember]);

  useEffect(() => {
    if (!selectedOwnedCar) {
      return undefined;
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSelectedOwnedCar(
          null
        );
      }
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedOwnedCar]);

  if (!loginUser) {
    return (
      <main className="mypage">
        <section className="mypage-header">
          <h1>
            마이페이지
          </h1>

          <Link
            to="/login"
            className="mypage-home-btn"
          >
            로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mypage">
      <section className="mypage-header">
        <h1>
          마이페이지
        </h1>

        <Link
          to={
            isDealer
              ? "/dealer"
              : "/"
          }
          className="mypage-home-btn"
        >
          {isDealer
            ? "공개페이지 이동"
            : "홈으로 이동"}
        </Link>
      </section>

      <section className="mypage-content">
        <div className="profile-card">
          <div className="profile-icon">
            {loginUser.name
              ?.charAt(0) ||
              getRoleName(
                loginUser.role
              ).charAt(0)}
          </div>

          <div className="profile-info">
            <h2>
              {loginUser.name}
            </h2>

            <p>
              {getRoleName(
                loginUser.role
              )}
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="mypage-info-title-row">
            <h3>
              계정 정보
            </h3>

            {isMember && (
              <button
                type="button"
                className="mypage-member-edit-btn"
                onClick={
                  openMemberEditModal
                }
              >
                회원정보 수정
              </button>
            )}
          </div>

          <div className="info-row">
            <span>
              아이디
            </span>

            <strong>
              {loginUser.loginId ||
                "-"}
            </strong>
          </div>

          <div className="info-row">
            <span>
              이름
            </span>

            <strong>
              {loginUser.name ||
                "-"}
            </strong>
          </div>

          <div className="info-row">
            <span>
              이메일
            </span>

            <strong>
              {loginUser.email ||
                "-"}
            </strong>
          </div>

          <div className="info-row">
            <span>
              연락처
            </span>

            <strong>
              {loginUser.phone ||
                "-"}
            </strong>
          </div>

          {isDealer && (
            <div className="info-row">
              <span>
                소속회사
              </span>

              <Link
                to="/company"
                className="mypage-company-link"
              >
                {loginUser
                  .companyName ||
                  "Kosmo 인증모터스"}
              </Link>
            </div>
          )}

          {isMember && (
            <div className="info-row">
              <span>
                보유 차량
              </span>

              {firstOwnedCar ? (
                <button
                  type="button"
                  className="owned-car-name-button"
                  onClick={() =>
                    setSelectedOwnedCar(
                      firstOwnedCar
                    )
                  }
                >
                  {getOwnedCarName(
                    firstOwnedCar
                  )}
                </button>
              ) : (
                <strong>
                  보유차량 없음
                </strong>
              )}
            </div>
          )}
        </div>

        {isMember && (
          <>
            <section className="member-data-section">
              <div className="mypage-section-header">
                <div>
                  <h3>
                    내가 찜한 차량
                  </h3>

                  <p>
                    찜하기로 저장한
                    회사딜러 매물 목록
                  </p>
                </div>
              </div>

              {isFavoriteCarsLoading ? (
                <div className="mypage-list-empty">
                  <strong>
                    관심 차량을 불러오는 중입니다.
                  </strong>
                </div>
              ) : favoriteCarsError ? (
                <div className="mypage-list-empty">
                  <strong>
                    {favoriteCarsError}
                  </strong>
                </div>
              ) : favoriteCars.length ===
                0 ? (
                <div className="mypage-list-empty">
                  <strong>
                    찜한 차량이
                    없습니다.
                  </strong>

                  <p>
                    차량 목록에서 관심
                    있는 매물을
                    찜해보세요.
                  </p>
                </div>
              ) : (
                <div className="favorite-car-list">
                  {favoriteCars.map(
                    (car) => {
                      const carId =
                        getCarId(
                          car
                        );

                      const carImage =
                        resolveCarImage(
                          car
                        );

                      const carName =
                        getCarName(
                          car
                        );

                      return (
                        <Link
                          key={
                            carId
                          }
                          to={`/cars/${carId}`}
                          className="favorite-car-item"
                        >
                          <div className="favorite-car-image">
                            {carImage ? (
                              <img
                                src={
                                  carImage
                                }
                                alt={`${carName} 이미지`}
                                loading="lazy"
                              />
                            ) : (
                              <span>
                                {car.imageText ||
                                  car.modelName ||
                                  car.model ||
                                  "CAR"}
                              </span>
                            )}
                          </div>

                          <div className="favorite-car-info">
                            <div className="favorite-car-title-row">
                              <h4>
                                {
                                  carName
                                }
                              </h4>

                              <span>
                                찜한 차량
                              </span>
                            </div>

                            <ul>
                              <li>
                                {car.year
                                  ? `${car.year}년식`
                                  : "연식 미등록"}
                              </li>

                              <li>
                                {getCarMileage(
                                  car
                                ).toLocaleString()}
                                km
                              </li>

                              <li>
                                {car.region ||
                                  car.state ||
                                  "지역 미등록"}
                              </li>
                            </ul>

                            <div className="favorite-car-bottom">
                              <strong>
                                {getCarPrice(
                                  car
                                ).toLocaleString()}
                                만원
                              </strong>

                              <span>
                                상세보기
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="member-data-section">
              <div className="mypage-section-header">
                <div>
                  <h3>
                    내 구매 문의 내역
                  </h3>

                  <p>
                    회사딜러에게 보낸
                    차량 문의
                  </p>
                </div>
              </div>

              {inquiryList.length ===
                0 ? (
                <div className="mypage-list-empty">
                  <strong>
                    구매 문의 내역이
                    없습니다.
                  </strong>

                  <p>
                    차량 상세 페이지에서
                    판매자에게 문의해보세요.
                  </p>
                </div>
              ) : (
                <div className="mypage-simple-table">
                  <div className="mypage-simple-table-head">
                    <span>
                      차량명
                    </span>

                    <span>
                      문의 내용
                    </span>

                    <span>
                      답변 상태
                    </span>

                    <span>
                      판매 상태
                    </span>
                  </div>

                  {inquiryList.map(
                    (inquiry) => (
                      <Link
                        key={
                          inquiry.id
                        }
                        to={`/cars/${inquiry.carId}`}
                        className="mypage-simple-table-row mypage-clickable-row"
                      >
                        <span>
                          {
                            inquiry.carName
                          }
                        </span>

                        <span>
                          {
                            inquiry.content
                          }
                        </span>

                        <span>
                          {
                            inquiry.inquiryStatus
                          }
                        </span>

                        <span>
                          {
                            inquiry.saleStatus
                          }
                        </span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="member-data-section">
              <div className="mypage-section-header">
                <div>
                  <h3>
                    내가 등록한 경매 차량
                  </h3>

                  <p>
                    회사와 딜러의 비공개
                    입찰이 진행되는 매물
                  </p>
                </div>

                <Link
                  to="/member/register-car"
                  className="mypage-section-link"
                >
                  차량 등록
                </Link>
              </div>

              {isMyCarsLoading ? (
                <div className="mypage-list-empty">
                  <strong>
                    등록 차량을
                    불러오는 중입니다.
                  </strong>

                  <p>
                    잠시만
                    기다려주세요.
                  </p>
                </div>
              ) : myCarsError ? (
                <div className="mypage-list-empty">
                  <strong>
                    등록 차량 조회에
                    실패했습니다.
                  </strong>

                  <p>
                    {myCarsError}
                  </p>
                </div>
              ) : registeredAuctionCars
                .length === 0 ? (
                <div className="mypage-list-empty">
                  <strong>
                    등록한 경매 차량이
                    없습니다.
                  </strong>

                  <p>
                    차량 등록 버튼을
                    이용해 경매 차량을
                    등록해보세요.
                  </p>
                </div>
              ) : (
                <div className="favorite-car-list">
                  {registeredAuctionCars.map(
                    (car) => {
                      const carId =
                        getCarId(
                          car
                        );

                      const carImage =
                        resolveCarImage(
                          car
                        );

                      const carName =
                        getCarName(
                          car
                        );

                      const auctionStatus =
                        getAuctionStatus(
                          car
                        );

                      const startPrice =
                        getCarPrice(
                          car
                        );

                      const mileage =
                        getCarMileage(
                          car
                        );

                      return (
                        <Link
                          key={
                            carId
                          }
                          to={`/cars/${carId}`}
                          className="favorite-car-item"
                        >
                          <div className="favorite-car-image">
                            {carImage ? (
                              <img
                                src={
                                  carImage
                                }
                                alt={`${carName} 대표 이미지`}
                                loading="lazy"
                              />
                            ) : (
                              <span>
                                {car.modelName ||
                                  car.model ||
                                  "CAR"}
                              </span>
                            )}
                          </div>

                          <div className="favorite-car-info">
                            <div className="favorite-car-title-row">
                              <h4>
                                {
                                  carName
                                }
                              </h4>

                              <span>
                                {
                                  auctionStatus
                                }
                              </span>
                            </div>

                            <ul>
                              <li>
                                {car.year
                                  ? `${car.year}년식`
                                  : "연식 미등록"}
                              </li>

                              <li>
                                {mileage.toLocaleString()}
                                km
                              </li>

                              <li>
                                {car.region ||
                                  car.state ||
                                  "지역 미등록"}
                              </li>
                            </ul>

                            <div className="favorite-car-bottom">
                              <strong>
                                {startPrice.toLocaleString()}
                                만원
                              </strong>

                              <span>
                                상세보기
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {isDealer ? (
          <section className="mypage-menu-card dealer-car-menu-card">
            <div className="mypage-section-header">
              <div>
                <h3>
                  내 매물
                </h3>

                <p>
                  등록한 매물을
                  확인하거나 관리하고
                  새로운 매물을
                  등록합니다.
                </p>
              </div>
            </div>

            <div className="mypage-menu-list dealer-mypage-menu-list">
              <Link
                to={`/company/dealers/${loginUser.dealerId ||
                  loginUser.id
                  }/cars`}
              >
                내 매물리스트
              </Link>

              <Link to="/dealer/cars">
                내 매물관리
              </Link>

              <Link to="/dealer/register-car">
                매물등록
              </Link>
            </div>
          </section>
        ) : (
          !isMember && (
            <div className="mypage-menu-card">
              <h3>
                바로가기
              </h3>

              <div className="mypage-menu-list">
                {myPageMenus.length ===
                  0 ? (
                  <p className="mypage-menu-empty">
                    이 계정은 아직
                    바로가기 메뉴가
                    없음
                  </p>
                ) : (
                  myPageMenus.map(
                    (menu) => (
                      <Link
                        key={
                          menu.id
                        }
                        to={
                          menu.path
                        }
                      >
                        {
                          menu.name
                        }
                      </Link>
                    )
                  )
                )}
              </div>
            </div>
          )
        )}
      </section>

      {isMember &&
        isMemberEditOpen && (
          <div
            className="member-edit-modal-backdrop"
            role="presentation"
            onMouseDown={
              closeMemberEditModal
            }
          >
            <section
              className="member-edit-modal"
              role="dialog"
              aria-modal="true"
              aria-label="회원정보 수정"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="member-edit-modal-header">
                <div>
                  <span>
                    일반회원
                  </span>

                  <h2>
                    회원정보 수정
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="회원정보 수정 닫기"
                  onClick={
                    closeMemberEditModal
                  }
                  disabled={
                    isMemberEditSubmitting
                  }
                >
                  ×
                </button>
              </div>

              <form
                className="member-edit-form"
                onSubmit={
                  handleMemberEditSubmit
                }
              >
                <div className="member-edit-form-grid">
                  <label>
                    <span>
                      이름
                    </span>

                    <input
                      type="text"
                      name="name"
                      value={
                        memberEditForm.name
                      }
                      onChange={
                        handleMemberEditChange
                      }
                      disabled={
                        isMemberEditSubmitting
                      }
                      maxLength={
                        50
                      }
                    />
                  </label>

                  <label>
                    <span>
                      이메일
                    </span>

                    <input
                      type="email"
                      name="email"
                      value={
                        memberEditForm.email
                      }
                      onChange={
                        handleMemberEditChange
                      }
                      disabled={
                        isMemberEditSubmitting
                      }
                      maxLength={
                        100
                      }
                    />
                  </label>

                  <label className="member-edit-full-field">
                    <span>
                      연락처
                    </span>

                    <input
                      type="text"
                      name="phone"
                      value={
                        memberEditForm.phone
                      }
                      onChange={
                        handleMemberEditChange
                      }
                      disabled={
                        isMemberEditSubmitting
                      }
                      maxLength={
                        20
                      }
                    />
                  </label>
                </div>

                <div className="member-edit-car-section">
                  <div className="member-edit-car-toggle">
                    <div>
                      <strong>
                        자차 보유 여부
                      </strong>

                      <p>
                        현재 보유한 차량이
                        있는지 선택합니다.
                      </p>
                    </div>

                    <label className="member-edit-switch">
                      <input
                        type="checkbox"
                        name="hasCar"
                        checked={
                          memberEditForm
                            .hasCar
                        }
                        onChange={
                          handleMemberEditChange
                        }
                        disabled={
                          isMemberEditSubmitting
                        }
                      />

                      <span>
                        {memberEditForm
                          .hasCar
                          ? "보유"
                          : "미보유"}
                      </span>
                    </label>
                  </div>

                  {memberEditForm
                    .hasCar && (
                      <div className="member-edit-form-grid">
                        <label>
                          <span>
                            제조사
                          </span>

                          <input
                            type="text"
                            name="ownedCarMake"
                            value={
                              memberEditForm
                                .ownedCarMake
                            }
                            onChange={
                              handleMemberEditChange
                            }
                            disabled={
                              isMemberEditSubmitting
                            }
                            placeholder="예: 현대"
                            maxLength={
                              50
                            }
                          />
                        </label>

                        <label>
                          <span>
                            모델
                          </span>

                          <input
                            type="text"
                            name="ownedCarModel"
                            value={
                              memberEditForm
                                .ownedCarModel
                            }
                            onChange={
                              handleMemberEditChange
                            }
                            disabled={
                              isMemberEditSubmitting
                            }
                            placeholder="예: 아반떼 CN7"
                            maxLength={
                              100
                            }
                          />
                        </label>

                        <label>
                          <span>
                            연식
                          </span>

                          <input
                            type="number"
                            name="ownedCarYear"
                            value={
                              memberEditForm
                                .ownedCarYear
                            }
                            onChange={
                              handleMemberEditChange
                            }
                            disabled={
                              isMemberEditSubmitting
                            }
                            min="1900"
                            max={
                              new Date()
                                .getFullYear() +
                              1
                            }
                            placeholder="예: 2021"
                          />
                        </label>

                        <label>
                          <span>
                            주행거리
                          </span>

                          <input
                            type="number"
                            name="ownedCarOdometer"
                            value={
                              memberEditForm
                                .ownedCarOdometer
                            }
                            onChange={
                              handleMemberEditChange
                            }
                            disabled={
                              isMemberEditSubmitting
                            }
                            min="0"
                            step="1"
                            placeholder="예: 42000"
                          />
                        </label>
                      </div>
                    )}
                </div>

                {memberEditMessage && (
                  <p className="member-edit-message">
                    {
                      memberEditMessage
                    }
                  </p>
                )}

                <div className="member-edit-actions">
                  <button
                    type="button"
                    className="member-edit-cancel-btn"
                    onClick={
                      closeMemberEditModal
                    }
                    disabled={
                      isMemberEditSubmitting
                    }
                  >
                    취소
                  </button>

                  <button
                    type="submit"
                    className="member-edit-save-btn"
                    disabled={
                      isMemberEditSubmitting
                    }
                  >
                    {isMemberEditSubmitting
                      ? "저장 중..."
                      : "저장"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

      {selectedOwnedCar && (
        <div
          className="owned-car-modal-backdrop"
          role="presentation"
          onMouseDown={() =>
            setSelectedOwnedCar(
              null
            )
          }
        >
          <section
            className="owned-car-modal"
            role="dialog"
            aria-modal="true"
            aria-label="보유 차량 상세 정보"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="owned-car-modal-header">
              <div>
                <span>
                  내 보유 차량
                </span>

                <h2>
                  {getOwnedCarName(
                    selectedOwnedCar
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="owned-car-modal-close"
                aria-label="보유 차량 상세 닫기"
                onClick={() =>
                  setSelectedOwnedCar(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="owned-car-modal-image">
              {resolveCarImage(
                selectedOwnedCar
              ) ? (
                <img
                  src={resolveCarImage(
                    selectedOwnedCar
                  )}
                  alt={getOwnedCarName(
                    selectedOwnedCar
                  )}
                />
              ) : (
                <div className="owned-car-modal-image-empty">
                  <strong>
                    {selectedOwnedCar
                      .imageText ||
                      selectedOwnedCar
                        .modelName ||
                      selectedOwnedCar
                        .model ||
                      "CAR"}
                  </strong>

                  <span>
                    등록된 차량 이미지가
                    없습니다.
                  </span>
                </div>
              )}
            </div>

            <dl className="owned-car-modal-spec">
              <div>
                <dt>
                  제조사
                </dt>

                <dd>
                  {selectedOwnedCar
                    .brand ||
                    selectedOwnedCar
                      .make ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  모델명
                </dt>

                <dd>
                  {selectedOwnedCar
                    .modelName ||
                    selectedOwnedCar
                      .model ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  연식
                </dt>

                <dd>
                  {selectedOwnedCar
                    .year
                    ? `${selectedOwnedCar.year}년식`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt>
                  차량번호
                </dt>

                <dd>
                  {selectedOwnedCar
                    .carNumber ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  주행거리
                </dt>

                <dd>
                  {selectedOwnedCar
                    .mileage !==
                    undefined &&
                    selectedOwnedCar
                      .mileage !==
                    null
                    ? `${Number(
                      selectedOwnedCar
                        .mileage
                    ).toLocaleString()}km`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt>
                  연료
                </dt>

                <dd>
                  {selectedOwnedCar
                    .fuel ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  변속기
                </dt>

                <dd>
                  {selectedOwnedCar
                    .transmission ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  외장 색상
                </dt>

                <dd>
                  {selectedOwnedCar
                    .color ||
                    "-"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}

export default MyPage;