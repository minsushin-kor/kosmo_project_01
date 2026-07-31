import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import SearchBox from "../../components/common/SearchBox";
import {
  useSearchParams,
} from "react-router-dom";
import {
  clearLastSearchCondition,
  getLastSearchCondition,
  initialSearchCondition,
  saveLastSearchCondition,
} from "../../data/searchData";
import CarCard from "../../components/car/CarCard";
import RightSidebar from "../../components/common/RightSidebar";
import {
  getCarList,
} from "../../api/carApi";
import {
  useAuth,
} from "../../hooks/useAuth";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import "../../css/home/indexPage.css";

const DEFAULT_SORT_TYPE =
  "latest";

const DEFAULT_VIEW_COUNT = 10;

const PAGE_GUIDES = {
  member: {
    title: "딜러 판매 차량",
    description:
      "회사 소속 딜러가 등록한 일반 중고거래 매물입니다.",
  },

  auction: {
    title: "일반회원 경매 차량",
    description:
      "일반회원이 등록한 차량에 비공개 입찰할 수 있습니다.",
  },

  default: {
    title: "차량 목록",
    description:
      "로그인 권한에 따라 구매 또는 입찰 가능한 매물이 구분됩니다.",
  },
};

function getRegisteredTime(car) {
  const timestamp =
    new Date(
      car.registeredDate ||
      car.createdAt ||
      ""
    ).getTime();

  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;
}

function getCarPrice(car) {
  const price =
    Number(
      car.price ??
      car.sellingPrice ??
      car.sellingprice ??
      car.auction?.startPrice ??
      car.startPrice ??
      0
    );

  return Number.isFinite(
    price
  )
    ? price
    : 0;
}

function getCarMileage(car) {
  const mileage =
    Number(
      car.mileage ??
      car.odometer ??
      0
    );

  return Number.isFinite(
    mileage
  )
    ? mileage
    : 0;
}

async function requestCarList() {
  const result =
    await getCarList({
      page: 0,
      size: 1000,
      sortBy: "createdAt",
      direction: "desc",
    });

  return Array.isArray(
    result?.cars
  )
    ? result.cars
    : [];
}

function isDealerNormalCar(car) {
  return (
    car.saleType === "NORMAL" &&
    (
      car.ownerType === "DEALER" ||
      car.sellerType === "회사딜러" ||
      (
        Boolean(car.dealerId) &&
        !car.memberId
      )
    )
  );
}

function isMemberAuctionCar(car) {
  return (
    car.saleType === "AUCTION" &&
    (
      car.ownerType === "MEMBER" ||
      car.sellerType === "일반회원" ||
      (
        Boolean(car.memberId) &&
        !car.dealerId
      )
    )
  );
}

function IndexPage() {
  const {
    loginUser,
  } = useAuth();

  const [
    allCars,
    setAllCars,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    searchCondition,
    setSearchCondition,
  ] = useState(() =>
    getLastSearchCondition() ||
    initialSearchCondition
  );

  const [
    recommendationSearchCondition,
    setRecommendationSearchCondition,
  ] = useState(() =>
    getLastSearchCondition()
  );

  const [
    sortType,
    setSortType,
  ] = useState(
    DEFAULT_SORT_TYPE
  );

  const [
    viewCount,
    setViewCount,
  ] = useState(
    DEFAULT_VIEW_COUNT
  );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const role =
    loginUser?.role;

  const [searchParams] =
    useSearchParams();

  const adminMarket =
    role === AUTH_ROLES.ADMIN
      ? searchParams.get("market")
      : null;

  useEffect(() => {
    let isMounted = true;

    requestCarList()
      .then((carList) => {
        if (!isMounted) {
          return;
        }

        setAllCars(
          carList
        );

        setErrorMessage("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error(
          "차량 목록 조회 실패:",
          error
        );

        setAllCars([]);

        setErrorMessage(
          error?.message ||
          "차량 목록을 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(
          false
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadCars =
    useCallback(async () => {
      if (isLoading) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const carList =
          await requestCarList();

        setAllCars(
          carList
        );
      } catch (error) {
        console.error(
          "차량 목록 새로고침 실패:",
          error
        );

        setAllCars([]);

        setErrorMessage(
          error?.message ||
          "차량 목록을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, [isLoading]);

  const roleCars =
    useMemo(() => {
      if (
        role ===
        AUTH_ROLES.MEMBER
      ) {
        return allCars.filter(isDealerNormalCar);
      }

      if (
        role ===
        AUTH_ROLES.COMPANY ||
        role ===
        AUTH_ROLES.DEALER
      ) {
        return allCars.filter(isMemberAuctionCar);
      }

      if (
        role === AUTH_ROLES.ADMIN &&
        adminMarket === "dealer"
      ) {
        return allCars.filter(isDealerNormalCar);
      }

      if (
        role === AUTH_ROLES.ADMIN &&
        adminMarket === "auction"
      ) {
        return allCars.filter(isMemberAuctionCar);
      }

      return allCars;
    }, [
      allCars,
      role,
      adminMarket,
    ]);

  const pageGuide =
    useMemo(() => {
      if (
        role ===
        AUTH_ROLES.MEMBER
      ) {
        return PAGE_GUIDES.member;
      }

      if (
        role ===
        AUTH_ROLES.COMPANY ||
        role ===
        AUTH_ROLES.DEALER
      ) {
        return PAGE_GUIDES.auction;
      }

      if (
        role === AUTH_ROLES.ADMIN &&
        adminMarket === "dealer"
      ) {
        return PAGE_GUIDES.member;
      }

      if (
        role === AUTH_ROLES.ADMIN &&
        adminMarket === "auction"
      ) {
        return PAGE_GUIDES.auction;
      }

      return PAGE_GUIDES.default;
    }, [role, adminMarket]);

  const filteredCars =
    useMemo(() => {
      const modelKeyword =
        String(
          searchCondition
            .modelName ||
          ""
        )
          .trim()
          .toLowerCase();

      const minPrice =
        Number(
          searchCondition
            .minPrice ||
          0
        );

      const maxPrice =
        Number(
          searchCondition
            .maxPrice ||
          Number.MAX_SAFE_INTEGER
        );

      const minYear =
        searchCondition.year ===
          ""
          ? null
          : Number(
            searchCondition
              .year
          );

      const maxMileage =
        searchCondition
          .mileage === ""
          ? null
          : Number(
            searchCondition
              .mileage
          );

      const filtered =
        roleCars.filter(
          (car) => {
            const carBrand =
              String(
                car.brand ||
                car.make ||
                ""
              );

            const matchBrand =
              searchCondition
                .brand === "" ||
              carBrand ===
              searchCondition
                .brand;

            const carModelName =
              String(
                car.modelName ||
                car.model ||
                ""
              ).toLowerCase();

            const carName =
              String(
                car.carName ||
                car.name ||
                ""
              ).toLowerCase();

            const matchModelName =
              modelKeyword ===
              "" ||
              carModelName.includes(
                modelKeyword
              ) ||
              carName.includes(
                modelKeyword
              );

            const carRegion =
              String(
                car.region ||
                car.state ||
                ""
              );

            const matchRegion =
              searchCondition
                .region === "" ||
              carRegion ===
              searchCondition
                .region;

            const carPrice =
              getCarPrice(
                car
              );

            const matchPrice =
              carPrice >=
              minPrice &&
              carPrice <=
              maxPrice;

            const matchYear =
              minYear ===
              null ||
              Number(
                car.year
              ) >= minYear;

            const matchMileage =
              maxMileage ===
              null ||
              getCarMileage(
                car
              ) <=
              maxMileage;

            return (
              matchBrand &&
              matchModelName &&
              matchRegion &&
              matchPrice &&
              matchYear &&
              matchMileage
            );
          }
        );

      const result = [
        ...filtered,
      ];

      switch (sortType) {
        case "priceLow":
          result.sort(
            (a, b) =>
              getCarPrice(a) -
              getCarPrice(b)
          );

          break;

        case "priceHigh":
          result.sort(
            (a, b) =>
              getCarPrice(b) -
              getCarPrice(a)
          );

          break;

        case "yearHigh":
          result.sort(
            (a, b) =>
              Number(b.year) -
              Number(a.year)
          );

          break;

        case "mileageLow":
          result.sort(
            (a, b) =>
              getCarMileage(a) -
              getCarMileage(b)
          );

          break;

        case "latest":
        default:
          result.sort(
            (a, b) =>
              getRegisteredTime(
                b
              ) -
              getRegisteredTime(
                a
              )
          );

          break;
      }

      return result;
    }, [
      roleCars,
      searchCondition,
      sortType,
    ]);

  const totalPage =
    Math.ceil(
      filteredCars.length /
      viewCount
    );

  const safeCurrentPage =
    totalPage === 0
      ? 1
      : Math.min(
        currentPage,
        totalPage
      );

  const visibleCars =
    useMemo(() => {
      const startIndex =
        (
          safeCurrentPage -
          1
        ) *
        viewCount;

      return filteredCars.slice(
        startIndex,
        startIndex +
        viewCount
      );
    }, [
      filteredCars,
      safeCurrentPage,
      viewCount,
    ]);

  const pageNumbers =
    useMemo(
      () =>
        Array.from(
          {
            length:
              totalPage,
          },
          (
            _,
            index
          ) =>
            index + 1
        ),
      [totalPage]
    );

  const handleSearchConditionChange =
    useCallback(
      (condition) => {
        setSearchCondition(
          condition
        );

        setCurrentPage(1);
      },
      []
    );

  const handleSearchSubmit =
    useCallback(
      (condition) => {
        const savedCondition = {
          ...initialSearchCondition,
          ...condition,
        };

        saveLastSearchCondition(
          savedCondition
        );
        setRecommendationSearchCondition(
          savedCondition
        );
        setCurrentPage(1);
      },
      []
    );

  const handleSearchReset =
    useCallback(() => {
      clearLastSearchCondition();
      setRecommendationSearchCondition(
        null
      );
      setCurrentPage(1);
    }, []);

  const handleSortChange =
    useCallback(
      (event) => {
        setSortType(
          event.target.value
        );

        setCurrentPage(1);
      },
      []
    );

  const handleViewCountChange =
    useCallback(
      (event) => {
        setViewCount(
          Number(
            event.target.value
          )
        );

        setCurrentPage(1);
      },
      []
    );

  const handlePrevPage =
    useCallback(() => {
      setCurrentPage(
        (prev) =>
          Math.max(
            1,
            prev - 1
          )
      );
    }, []);

  const handleNextPage =
    useCallback(() => {
      setCurrentPage(
        (prev) =>
          Math.min(
            totalPage,
            prev + 1
          )
      );
    }, [totalPage]);

  return (
    <main className="index-page">
      <section className="index-main-layout">
        <aside className="left-search-sidebar">
          <SearchBox
            searchCondition={
              searchCondition
            }
            setSearchCondition={
              handleSearchConditionChange
            }
            onSearch={
              handleSearchSubmit
            }
            onReset={
              handleSearchReset
            }
          />
        </aside>

        <section className="car-list-section">
          <div className="car-list-header">
            <div>
              <h2>
                {
                  pageGuide.title
                }
              </h2>

              <p className="car-list-summary">
                {
                  pageGuide.description
                }

                <br />

                총{" "}
                <strong>
                  {
                    filteredCars.length
                  }
                </strong>
                대의 차량이
                검색되었습니다.
              </p>
            </div>

            <div className="car-list-control">
              <button
                type="button"
                className="car-reload-button"
                onClick={
                  loadCars
                }
                disabled={
                  isLoading
                }
              >
                {isLoading
                  ? "불러오는 중..."
                  : "새로고침"}
              </button>

              <select
                className="car-sort-select"
                value={
                  sortType
                }
                onChange={
                  handleSortChange
                }
                disabled={
                  isLoading
                }
              >
                <option value="latest">
                  최근등록순
                </option>

                <option value="priceLow">
                  낮은가격순
                </option>

                <option value="priceHigh">
                  높은가격순
                </option>

                <option value="yearHigh">
                  최신연식순
                </option>

                <option value="mileageLow">
                  주행거리 짧은순
                </option>
              </select>

              <select
                className="car-sort-select"
                value={
                  viewCount
                }
                onChange={
                  handleViewCountChange
                }
                disabled={
                  isLoading
                }
              >
                <option value={10}>
                  10개씩 보기
                </option>

                <option value={15}>
                  15개씩 보기
                </option>

                <option value={20}>
                  20개씩 보기
                </option>
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="car-list-message">
              차량 목록을
              불러오는 중입니다.
            </div>
          )}

          {!isLoading &&
            errorMessage && (
              <div className="car-list-error">
                <p>
                  {
                    errorMessage
                  }
                </p>

                <button
                  type="button"
                  onClick={
                    loadCars
                  }
                >
                  다시 시도
                </button>
              </div>
            )}

          {!isLoading &&
            !errorMessage &&
            visibleCars.length >
            0 && (
              <>
                <div className="car-card-list">
                  {visibleCars.map(
                    (
                      car,
                      index
                    ) => (
                      <CarCard
                        key={
                          car.id ??
                          car.carId ??
                          `car-${index}`
                        }
                        car={
                          car
                        }
                      />
                    )
                  )}
                </div>

                {totalPage >
                  1 && (
                    <div className="pagination">
                      <button
                        type="button"
                        className="page-button"
                        onClick={
                          handlePrevPage
                        }
                        disabled={
                          safeCurrentPage ===
                          1
                        }
                      >
                        이전
                      </button>

                      {pageNumbers.map(
                        (page) => (
                          <button
                            key={
                              page
                            }
                            type="button"
                            className={`page-button ${safeCurrentPage ===
                                page
                                ? "active"
                                : ""
                              }`}
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="page-button"
                        onClick={
                          handleNextPage
                        }
                        disabled={
                          safeCurrentPage ===
                          totalPage
                        }
                      >
                        다음
                      </button>
                    </div>
                  )}
              </>
            )}

          {!isLoading &&
            !errorMessage &&
            visibleCars.length ===
            0 && (
              <div className="empty-result">
                현재 등록된 차량이
                없거나 조건에 맞는
                차량이 없습니다.
              </div>
            )}
        </section>

        <aside className="right-info-sidebar">
          <RightSidebar
            setSearchCondition={
              setSearchCondition
            }
            setCurrentPage={
              setCurrentPage
            }
            allCars={
              allCars
            }
            candidateCars={
              roleCars
            }
            recommendationSearchCondition={
              recommendationSearchCondition
            }
            onSearchConditionApply={
              handleSearchSubmit
            }
          />
        </aside>
      </section>
    </main>
  );
}

export default IndexPage;
