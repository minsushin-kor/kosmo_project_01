import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import cars from "../../data/cars";
import {
  AUTH_ROLES,
  getRoleName,
} from "../../data/authUser";
import {
  getMyPageMenusByRole,
} from "../../data/myPageMenuData";
import {
  getDealerCarsFromStorage,
} from "../../utils/dealerCarStorage";
import {
  useAuth,
} from "../../hooks/useAuth";
import "../../css/member/myPage.css";

const FAVORITE_STORAGE_KEYS = [
  "car_front_favorite_car_ids",
  "favoriteCarIds",
  "carFavorites",
];

function readFavoriteCarIds() {
  for (
    const storageKey of
    FAVORITE_STORAGE_KEYS
  ) {
    try {
      const savedValue =
        JSON.parse(
          localStorage.getItem(
            storageKey
          ) || "[]"
        );

      if (
        !Array.isArray(
          savedValue
        )
      ) {
        continue;
      }

      return savedValue
        .map((item) => {
          if (
            typeof item ===
              "number" ||
            typeof item ===
              "string"
          ) {
            return Number(item);
          }

          return Number(
            item.carId ||
              item.listingId ||
              item.id
          );
        })
        .filter((id) =>
          Number.isFinite(id)
        );
    } catch (error) {
      console.error(
        `${storageKey} 찜 목록 조회 오류`,
        error
      );
    }
  }

  return [];
}

function resolveCarImage(car) {
  return (
    car?.imageUrl ||
    car?.image ||
    car?.thumbnailUrl ||
    car?.previewUrl ||
    car?.images?.[0]?.previewUrl ||
    car?.images?.[0]?.url ||
    ""
  );
}

function getOwnedCarName(car) {
  if (!car) {
    return "보유차량 없음";
  }

  return (
    car.carName ||
    `${car.brand || ""} ${
      car.modelName ||
      car.model ||
      ""
    }`.trim() ||
    "차량명 없음"
  );
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
    favoriteVersion,
    setFavoriteVersion,
  ] = useState(0);

  const isMember =
    loginUser?.role ===
    AUTH_ROLES.MEMBER;

  const isDealer =
    loginUser?.role ===
    AUTH_ROLES.DEALER;

  const myPageMenus = loginUser
    ? getMyPageMenusByRole(
        loginUser.role
      )
    : [];

  const ownedCars = Array.isArray(
    loginUser?.ownedCars
  )
    ? loginUser.ownedCars
    : [];

  const firstOwnedCar =
    ownedCars[0] || null;

  const allCars = useMemo(() => {
    const storageCars =
      getDealerCarsFromStorage();

    const carMap =
      new Map();

    [
      ...storageCars,
      ...cars,
    ].forEach((car) => {
      carMap.set(
        Number(car.id),
        car
      );
    });

    return Array.from(
      carMap.values()
    );
  }, []);

  const favoriteCars =
    useMemo(() => {
      const favoriteIds =
        readFavoriteCarIds();

      const favoriteIdSet =
        new Set(
          favoriteIds.map(Number)
        );

      return allCars.filter(
        (car) =>
          favoriteIdSet.has(
            Number(car.id)
          )
      );
    }, [
      allCars,
      favoriteVersion,
    ]);

  const inquiryList = useMemo(
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

  const registeredAuctionCars =
    useMemo(
      () => [
        {
          id: 1,
          carId: 101,
          carName:
            "현대 그랜저 IG 개인 경매 1호",
          year: 2017,
          startPrice: 2250,
          auctionStatus:
            "경매중",
        },
        {
          id: 2,
          carId: 102,
          carName:
            "기아 스포티지 NQ5 개인 경매 1호",
          year: 2018,
          startPrice: 2760,
          auctionStatus:
            "경매중",
        },
      ],
      []
    );

  useEffect(() => {
    function handleFavoriteChange() {
      setFavoriteVersion(
        (prev) =>
          prev + 1
      );
    }

    window.addEventListener(
      "favorite-change",
      handleFavoriteChange
    );

    window.addEventListener(
      "storage",
      handleFavoriteChange
    );

    return () => {
      window.removeEventListener(
        "favorite-change",
        handleFavoriteChange
      );

      window.removeEventListener(
        "storage",
        handleFavoriteChange
      );
    };
  }, []);

  useEffect(() => {
    if (!selectedOwnedCar) {
      return undefined;
    }

    function handleKeyDown(event) {
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
            {loginUser.name?.charAt(
              0
            ) ||
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
          <h3>
            계정 정보
          </h3>

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
                {loginUser.companyName ||
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

              {favoriteCars.length ===
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
                      const carImage =
                        resolveCarImage(
                          car
                        );

                      return (
                        <Link
                          key={car.id}
                          to={`/cars/${car.id}`}
                          className="favorite-car-item"
                        >
                          <div className="favorite-car-image">
                            {carImage ? (
                              <img
                                src={
                                  carImage
                                }
                                alt={
                                  car.carName ||
                                  car.modelName ||
                                  "차량 이미지"
                                }
                              />
                            ) : (
                              <span>
                                {car.imageText ||
                                  car.modelName ||
                                  "CAR"}
                              </span>
                            )}
                          </div>

                          <div className="favorite-car-info">
                            <div className="favorite-car-title-row">
                              <h4>
                                {car.carName ||
                                  `${
                                    car.brand ||
                                    ""
                                  } ${
                                    car.modelName ||
                                    ""
                                  }`.trim()}
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
                                {car.mileage !==
                                undefined
                                  ? `${Number(
                                      car.mileage
                                    ).toLocaleString()}km`
                                  : "주행거리 미등록"}
                              </li>

                              <li>
                                {car.region ||
                                  "지역 미등록"}
                              </li>
                            </ul>

                            <div className="favorite-car-bottom">
                              <strong>
                                {Number(
                                  car.price ||
                                    0
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

              <div className="mypage-simple-table">
                <div className="mypage-simple-table-head">
                  <span>
                    차량명
                  </span>

                  <span>
                    문의내용
                  </span>

                  <span>
                    문의상태
                  </span>

                  <span>
                    판매상태
                  </span>
                </div>

                {inquiryList.length ===
                0 ? (
                  <div className="mypage-table-empty">
                    구매 문의 내역이
                    없습니다.
                  </div>
                ) : (
                  inquiryList.map(
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
                  )
                )}
              </div>
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

              <div className="mypage-simple-table">
                <div className="mypage-simple-table-head">
                  <span>
                    차량명
                  </span>

                  <span>
                    연식
                  </span>

                  <span>
                    경매 시작가
                  </span>

                  <span>
                    경매 상태
                  </span>
                </div>

                {registeredAuctionCars.length ===
                0 ? (
                  <div className="mypage-table-empty">
                    등록한 경매 차량이
                    없습니다.
                  </div>
                ) : (
                  registeredAuctionCars.map(
                    (car) => (
                      <Link
                        key={car.id}
                        to={`/cars/${car.carId}`}
                        className="mypage-simple-table-row mypage-clickable-row"
                      >
                        <span>
                          {car.carName}
                        </span>

                        <span>
                          {car.year
                            ? `${car.year}년식`
                            : "-"}
                        </span>

                        <span>
                          {Number(
                            car.startPrice
                          ).toLocaleString()}
                          만원
                        </span>

                        <span>
                          {
                            car.auctionStatus
                          }
                        </span>
                      </Link>
                    )
                  )
                )}
              </div>
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
                  등록한 매물을 확인하거나
                  관리하고 새로운 매물을
                  등록합니다.
                </p>
              </div>
            </div>

            <div className="mypage-menu-list dealer-mypage-menu-list">
              <Link
                to={`/company/dealers/${
                  loginUser.dealerId ||
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
                    바로가기 메뉴가 없음
                  </p>
                ) : (
                  myPageMenus.map(
                    (menu) => (
                      <Link
                        key={menu.id}
                        to={menu.path}
                      >
                        {menu.name}
                      </Link>
                    )
                  )
                )}
              </div>
            </div>
          )
        )}
      </section>

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
            onMouseDown={(event) =>
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
                    {selectedOwnedCar.imageText ||
                      selectedOwnedCar.modelName ||
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
                  {selectedOwnedCar.brand ||
                    selectedOwnedCar.make ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  모델명
                </dt>

                <dd>
                  {selectedOwnedCar.modelName ||
                    selectedOwnedCar.model ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  연식
                </dt>

                <dd>
                  {selectedOwnedCar.year
                    ? `${selectedOwnedCar.year}년식`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt>
                  차량번호
                </dt>

                <dd>
                  {selectedOwnedCar.carNumber ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  주행거리
                </dt>

                <dd>
                  {selectedOwnedCar.mileage !==
                  undefined
                    ? `${Number(
                        selectedOwnedCar.mileage
                      ).toLocaleString()}km`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt>
                  연료
                </dt>

                <dd>
                  {selectedOwnedCar.fuel ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  변속기
                </dt>

                <dd>
                  {selectedOwnedCar.transmission ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt>
                  외장 색상
                </dt>

                <dd>
                  {selectedOwnedCar.color ||
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