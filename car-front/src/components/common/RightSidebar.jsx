import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  initialSearchCondition,
} from "../../data/searchData";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import useAuth from "../../hooks/useAuth";
import {
  getBuyerAiRecommendations,
  getDealerAiRecommendations,
} from "../../api/carApi";
import {
  clearRecentCarIds,
  getRecentCars,
  getRecommendedCars,
} from "../../utils/carRecommendationStorage";
import "../../css/common/rightSidebar.css";

const RECENT_CAR_CHANGE_EVENT =
  "recent-car-change";

const DEALER_RECOMMENDATION_CRITERIA = {
  CONDITION: "condition",
  MMR: "mmr",
};

const MEMBER_RECOMMENDATION_PRIORITIES = {
  PREFERRED_CAR: "preferred_car",
  RECENT_SEARCH: "recent_search",
};

function getRecommendationScore(
  car,
  criterion
) {
  const score = Number(
    car?.[criterion]
  );

  return Number.isFinite(score)
    ? score
    : Number.NEGATIVE_INFINITY;
}

function compareRecommendationScores(
  firstScore,
  secondScore
) {
  if (firstScore === secondScore) {
    return 0;
  }

  return secondScore > firstScore
    ? 1
    : -1;
}

function sortDealerRecommendations(
  recommendations,
  criterion
) {
  const secondaryCriterion =
    criterion ===
      DEALER_RECOMMENDATION_CRITERIA.MMR
      ? DEALER_RECOMMENDATION_CRITERIA.CONDITION
      : DEALER_RECOMMENDATION_CRITERIA.MMR;

  return [...recommendations].sort(
    (firstCar, secondCar) => {
      const primaryDifference =
        compareRecommendationScores(
          getRecommendationScore(
            firstCar,
            criterion
          ),
          getRecommendationScore(
            secondCar,
            criterion
          )
        );

      if (primaryDifference !== 0) {
        return primaryDifference;
      }

      return compareRecommendationScores(
        getRecommendationScore(
          firstCar,
          secondaryCriterion
        ),
        getRecommendationScore(
          secondCar,
          secondaryCriterion
        )
      );
    }
  );
}

function buildBuyerPreferences(
  searchCondition,
  recommendationPriority,
  preferredCar
) {
  const preferences = {
    recommendationPriority,
  };

  const normalizedPreferredCar = String(
    preferredCar || ""
  ).trim();

  if (normalizedPreferredCar) {
    preferences.preferredCar =
      normalizedPreferredCar;
  }

  if (!searchCondition) {
    return preferences;
  }

  const brand = String(
    searchCondition.brand || ""
  ).trim();
  const modelName = String(
    searchCondition.modelName || ""
  ).trim();
  const region = String(
    searchCondition.region || ""
  ).trim();

  if (brand) {
    preferences.preferredMake = brand;
  }
  if (modelName) {
    preferences.preferredModel = modelName;
  }
  if (searchCondition.year !== "") {
    preferences.preferredYear = Number(
      searchCondition.year
    );
  }
  if (searchCondition.mileage !== "") {
    preferences.maxOdometer = Number(
      searchCondition.mileage
    );
  }
  if (region) {
    preferences.preferredRegion = region;
  }

  const minPrice = Number(
    searchCondition.minPrice
  );
  const maxPrice = Number(
    searchCondition.maxPrice
  );
  if (
    Number.isFinite(minPrice) &&
    Number.isFinite(maxPrice) &&
    maxPrice > minPrice
  ) {
    preferences.expectedPrice =
      ((minPrice + maxPrice) / 2) *
      10000;
    preferences.priceTolerance =
      ((maxPrice - minPrice) / 2) *
      10000;
  }

  return preferences;
}

function mergeRecommendationCars(
  recommendations,
  allCars
) {
  const carById = new Map(
    allCars.map((car) => [
      Number(car.id),
      car,
    ])
  );

  return recommendations
    .map((recommendation) => {
      const currentCar = carById.get(
        Number(recommendation.id)
      );

      if (!currentCar) {
        return recommendation;
      }

      return {
        ...currentCar,
        ...recommendation,
        images:
          currentCar.images?.length > 0
            ? currentCar.images
            : recommendation.images,
        carName:
          currentCar.carName ||
          recommendation.carName,
        price:
          currentCar.price ??
          recommendation.price,
      };
    })
    .filter((car) => car?.id)
    .slice(0, 4);
}

const POPULAR_SEARCH_CONDITIONS = {
  lowPrice: {
    minPrice: 500,
    maxPrice: 2000,
  },

  suv: {
    modelName: "스포티지",
  },

  lowMileage: {
    mileage: "50000",
  },

  gyeonggi: {
    region: "경기도",
  },

  recentYear: {
    year: "2021",
  },
};

const NOTICE_ITEMS = [
  "허위 매물 신고 정책 안내",
  "딜러 인증 심사 기준 안내",
  "차량 거래 안전 수칙",
];

const MiniCarItem = memo(
  function MiniCarItem({
    car,
    label,
  }) {
    return (
      <Link
        to={`/cars/${car.id}`}
        className="sidebar-car-item"
      >
        <div className="sidebar-car-image">
          {car.imageText || "CAR"}
        </div>

        <div className="sidebar-car-info">
          {label && (
            <span className="sidebar-car-label">
              {label}
            </span>
          )}

          <strong>
            {car.carName}
          </strong>

          <p>
            {car.year}년식 ·{" "}
            {Number(
              car.price
            ).toLocaleString()}
            만원
          </p>
        </div>
      </Link>
    );
  }
);

function RightSidebar({
  setSearchCondition,
  setCurrentPage,
  allCars = [],
  candidateCars = [],
  recommendationSearchCondition,
  onSearchConditionApply,
}) {
  const navigate = useNavigate();
  const {
    loginUser,
  } = useAuth();

  const [
    recentVersion,
    setRecentVersion,
  ] = useState(0);

  const [
    aiRecommendedCars,
    setAiRecommendedCars,
  ] = useState([]);

  const [
    isRecommendationLoading,
    setIsRecommendationLoading,
  ] = useState(false);

  const [
    recommendationMessage,
    setRecommendationMessage,
  ] = useState("");

  const [
    dealerRecommendationCriterion,
    setDealerRecommendationCriterion,
  ] = useState(
    DEALER_RECOMMENDATION_CRITERIA.CONDITION
  );

  const [
    memberRecommendationPriority,
    setMemberRecommendationPriority,
  ] = useState(
    MEMBER_RECOMMENDATION_PRIORITIES.PREFERRED_CAR
  );

  const role =
    loginUser?.role;

  const isMember =
    role === AUTH_ROLES.MEMBER;

  const isDealer =
    role === AUTH_ROLES.DEALER;

  const memberPreferredCar =
    isMember
      ? String(
        loginUser?.preferredCar || ""
      ).trim()
      : "";

  useEffect(() => {
    const handleRecentCarChange =
      () => {
        setRecentVersion(
          (prev) => prev + 1
        );
      };

    window.addEventListener(
      RECENT_CAR_CHANGE_EVENT,
      handleRecentCarChange
    );

    return () => {
      window.removeEventListener(
        RECENT_CAR_CHANGE_EVENT,
        handleRecentCarChange
      );
    };
  }, []);

  useEffect(() => {
    if (!isMember && !isDealer) {
      return undefined;
    }

    let isActive = true;

    const loadRecommendations = async () => {
      setIsRecommendationLoading(true);
      setRecommendationMessage("");

      try {
        const cars = isDealer
          ? await getDealerAiRecommendations()
          : await getBuyerAiRecommendations(
            buildBuyerPreferences(
              recommendationSearchCondition,
              memberRecommendationPriority,
              memberPreferredCar
            )
          );

        if (isActive) {
          setAiRecommendedCars(cars);
        }
      } catch (error) {
        if (isActive) {
          setAiRecommendedCars([]);
          setRecommendationMessage(
            error?.message ||
            "추천 차량을 불러오지 못했습니다."
          );
        }
      } finally {
        if (isActive) {
          setIsRecommendationLoading(false);
        }
      }
    };

    void loadRecommendations();

    return () => {
      isActive = false;
    };
  }, [
    isDealer,
    isMember,
    memberPreferredCar,
    memberRecommendationPriority,
    recommendationSearchCondition,
  ]);

  const recentCars = useMemo(
    () => {
      /*
       * 최근 본 차량 변경 이벤트가 발생하면
       * localStorage 데이터를 다시 읽습니다.
       */
      void recentVersion;

      return getRecentCars(
        allCars
      ).slice(0, 3);
    },
    [
      allCars,
      recentVersion,
    ]
  );

  const localRecommendedCars = useMemo(
    () => {
      /*
       * 최근 본 차량 목록도 추천 결과에 영향을 주므로
       * 변경 시 추천 차량을 다시 계산합니다.
       */
      void recentVersion;

      return getRecommendedCars({
        candidateCars,
        allCars,
        loginUser,
        limit: 4,
      });
    },
    [
      allCars,
      candidateCars,
      loginUser,
      recentVersion,
    ]
  );

  const sortedAiRecommendedCars = useMemo(
    () =>
      isDealer
        ? sortDealerRecommendations(
          aiRecommendedCars,
          dealerRecommendationCriterion
        )
        : aiRecommendedCars,
    [
      aiRecommendedCars,
      dealerRecommendationCriterion,
      isDealer,
    ]
  );

  const recommendedCars = useMemo(
    () =>
      isMember || isDealer
        ? mergeRecommendationCars(
          sortedAiRecommendedCars,
          allCars
        )
        : localRecommendedCars,
    [
      allCars,
      isDealer,
      isMember,
      localRecommendedCars,
      sortedAiRecommendedCars,
    ]
  );

  const applyPopularSearch =
    useCallback(
      (type) => {
        const condition =
          POPULAR_SEARCH_CONDITIONS[
          type
          ];

        if (!condition) {
          return;
        }

        const appliedCondition = {
          ...initialSearchCondition,
          ...condition,
        };

        setSearchCondition(
          appliedCondition
        );
        onSearchConditionApply?.(
          appliedCondition
        );

        setCurrentPage(1);
      },
      [
        setCurrentPage,
        setSearchCondition,
        onSearchConditionApply,
      ]
    );

  const handleClearRecentCars =
    useCallback(() => {
      clearRecentCarIds();
    }, []);

  const handleMemberRegister =
    useCallback(() => {
      navigate(
        "/member/register-car"
      );
    }, [navigate]);

  const handleDealerRegister =
    useCallback(() => {
      navigate(
        "/dealer/register-car"
      );
    }, [navigate]);

  const handleNoticePage =
    useCallback(() => {
      navigate(
        "/company/notices"
      );
    }, [navigate]);

  return (
    <div className="right-sidebar">
      <section className="right-widget">
        <div className="right-widget-title-row">
          <h3>최근 본 차량</h3>

          {recentCars.length > 0 && (
            <button
              type="button"
              onClick={
                handleClearRecentCars
              }
            >
              전체삭제
            </button>
          )}
        </div>

        {recentCars.length > 0 ? (
          <div className="sidebar-car-list">
            {recentCars.map(
              (car) => (
                <MiniCarItem
                  key={car.id}
                  car={car}
                />
              )
            )}
          </div>
        ) : (
          <div className="recent-car-empty">
            최근 본 차량이 없습니다.
          </div>
        )}
      </section>

      <section className="right-widget recommendation-widget">
        <div className="right-widget-title-row">
          <h3>
            {isDealer
              ? "AI 경매 추천"
              : "추천 차량"}
          </h3>

          <span>
            {isDealer
              ? dealerRecommendationCriterion ===
                DEALER_RECOMMENDATION_CRITERIA.CONDITION
                ? "상태 우선"
                : "가격 우선"
              : isMember
                ? memberRecommendationPriority ===
                  MEMBER_RECOMMENDATION_PRIORITIES.PREFERRED_CAR
                  ? "선호차량 우선"
                  : "검색 우선"
                : "맞춤 추천"}
          </span>
        </div>

        <p className="recommendation-guide">
          {isDealer
            ? dealerRecommendationCriterion ===
              DEALER_RECOMMENDATION_CRITERIA.CONDITION
              ? "예상 차량 상태가 좋은 순서로 경매 차량을 추천합니다."
              : "예상 차량 가격이 높은 순서로 경매 차량을 추천합니다."
            : isMember
              ? memberRecommendationPriority ===
                MEMBER_RECOMMENDATION_PRIORITIES.PREFERRED_CAR
                ? "회원가입 때 등록한 선호차량을 먼저 반영하고 최근 검색 조건을 함께 계산합니다."
                : "최근 검색 조건을 먼저 반영하고 회원가입 선호차량을 함께 계산합니다."
              : "최근 검색 조건과 회원가입 때 등록한 선호차량을 기준으로 추천합니다."}
        </p>

        {isMember && (
          <fieldset className="recommendation-criterion-selector">
            <legend>추천 기준</legend>

            <label>
              <input
                type="radio"
                name="memberRecommendationPriority"
                value={
                  MEMBER_RECOMMENDATION_PRIORITIES.PREFERRED_CAR
                }
                checked={
                  memberRecommendationPriority ===
                  MEMBER_RECOMMENDATION_PRIORITIES.PREFERRED_CAR
                }
                onChange={(event) =>
                  setMemberRecommendationPriority(
                    event.target.value
                  )
                }
              />
              <span>가입 선호차량 우선</span>
            </label>

            <label>
              <input
                type="radio"
                name="memberRecommendationPriority"
                value={
                  MEMBER_RECOMMENDATION_PRIORITIES.RECENT_SEARCH
                }
                checked={
                  memberRecommendationPriority ===
                  MEMBER_RECOMMENDATION_PRIORITIES.RECENT_SEARCH
                }
                onChange={(event) =>
                  setMemberRecommendationPriority(
                    event.target.value
                  )
                }
              />
              <span>최근 검색 우선</span>
            </label>
          </fieldset>
        )}

        {isDealer && (
          <fieldset className="recommendation-criterion-selector">
            <legend>추천 기준</legend>

            <label>
              <input
                type="radio"
                name="dealerRecommendationCriterion"
                value={
                  DEALER_RECOMMENDATION_CRITERIA.CONDITION
                }
                checked={
                  dealerRecommendationCriterion ===
                  DEALER_RECOMMENDATION_CRITERIA.CONDITION
                }
                onChange={(event) =>
                  setDealerRecommendationCriterion(
                    event.target.value
                  )
                }
              />
              <span>AI 예상 차량 상태</span>
            </label>

            <label>
              <input
                type="radio"
                name="dealerRecommendationCriterion"
                value={
                  DEALER_RECOMMENDATION_CRITERIA.MMR
                }
                checked={
                  dealerRecommendationCriterion ===
                  DEALER_RECOMMENDATION_CRITERIA.MMR
                }
                onChange={(event) =>
                  setDealerRecommendationCriterion(
                    event.target.value
                  )
                }
              />
              <span>AI 예상 차량 가격</span>
            </label>
          </fieldset>
        )}

        {isRecommendationLoading ? (
          <div className="recent-car-empty">
            추천 차량을 계산하고 있습니다.
          </div>
        ) : recommendationMessage ? (
          <div className="recent-car-empty">
            {recommendationMessage}
          </div>
        ) : recommendedCars.length > 0 ? (
          <div className="sidebar-car-list">
            {recommendedCars.map(
              (car) => (
                <MiniCarItem
                  key={car.id}
                  car={car}
                  label={
                    isDealer
                      ? "AI 추천"
                      : "추천"
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="recent-car-empty">
            추천할 차량이 없습니다.
          </div>
        )}
      </section>

      <section className="right-widget">
        <h3>인기 검색 조건</h3>

        <div className="keyword-list">
          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "lowPrice"
              )
            }
          >
            # 2천만원 이하
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "suv"
              )
            }
          >
            # SUV
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "lowMileage"
              )
            }
          >
            # 5만km 이하
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "gyeonggi"
              )
            }
          >
            # 경기도 매물
          </button>

          <button
            type="button"
            onClick={() =>
              applyPopularSearch(
                "recentYear"
              )
            }
          >
            # 2021년식 이상
          </button>
        </div>
      </section>

      {isMember && (
        <section className="right-widget dealer-guide">
          <h3>
            내 중고차 매물 등록
          </h3>

          <p>
            보유 차량을 등록하면 회사와
            딜러가 비공개 입찰에
            참여합니다.
          </p>

          <button
            type="button"
            onClick={
              handleMemberRegister
            }
          >
            중고차 매물 등록하기
          </button>
        </section>
      )}

      {isDealer && (
        <section className="right-widget dealer-guide">
          <h3>
            딜러 매물 등록
          </h3>

          <p>
            보유 차량을 등록하고
            일반회원에게 판매할 수
            있습니다.
          </p>

          <button
            type="button"
            onClick={
              handleDealerRegister
            }
          >
            딜러 매물 등록하기
          </button>
        </section>
      )}

      <section className="right-widget notice-widget">
        <div className="right-widget-title-row">
          <h3>공지사항</h3>

          <button
            type="button"
            onClick={
              handleNoticePage
            }
          >
            더보기
          </button>
        </div>

        <ul>
          {NOTICE_ITEMS.map(
            (notice) => (
              <li key={notice}>
                <button
                  type="button"
                  onClick={
                    handleNoticePage
                  }
                >
                  {notice}
                </button>
              </li>
            )
          )}
        </ul>
      </section>
    </div>
  );
}

export default memo(
  RightSidebar
);
