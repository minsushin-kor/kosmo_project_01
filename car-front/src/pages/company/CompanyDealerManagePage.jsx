import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import PageTitle from "../../components/common/PageTitle";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import {
  getCompanyDealers,
  withdrawCompanyDealer,
} from "../../api/dealerApi";
import "../../css/common/page.css";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

const STATUS_LABEL_MAP = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
};

function normalizeDealer(
  dealer
) {
  const statusCode = String(
    dealer.status || "ACTIVE"
  ).toUpperCase();

  return {
    ...dealer,

    id: dealer.dealerId,

    dealerId:
      dealer.dealerId,

    profileImageUrl:
      dealer.profileImageUrl ||
      "",

    statusCode,

    status:
      STATUS_LABEL_MAP[
      statusCode
      ] || statusCode,

    carCount:
      Number(
        dealer.carCount || 0
      ),

    soldCount:
      Number(
        dealer.soldCount || 0
      ),

    joinDate:
      dealer.createdAt
        ? new Date(
          dealer.createdAt
        ).toLocaleDateString(
          "ko-KR"
        )
        : "-",
  };
}

function CompanyDealerManagePage() {
  const [
    dealers,
    setDealers,
  ] = useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("전체");

  const [
    selectedDealer,
    setSelectedDealer,
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

  const loadDealers =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result =
          await getCompanyDealers();

        const dealerList =
          Array.isArray(result)
            ? result
            : [];

        setDealers(
          dealerList.map(
            normalizeDealer
          )
        );
      } catch (error) {
        console.error(
          "소속 딜러 목록 조회 실패:",
          error
        );

        setErrorMessage(
          error.message ||
          "소속 딜러 목록을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    let isActive = true;

    getCompanyDealers()
      .then((result) => {
        if (!isActive) {
          return;
        }

        const dealerList =
          Array.isArray(result)
            ? result
            : [];

        setDealers(
          dealerList.map(
            normalizeDealer
          )
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(
          "소속 딜러 목록 조회 실패:",
          error
        );

        setErrorMessage(
          error.message ||
          "소속 딜러 목록을 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  function handleResetFilter() {
    setSearchText("");
    setStatusFilter("전체");
  }

  function handleOpenDetail(
    dealer
  ) {
    setSelectedDealer(dealer);
  }

  function handleCloseDetail() {
    if (isUpdating) {
      return;
    }

    setSelectedDealer(null);
  }

  async function handleWithdrawDealer() {
    if (
      !selectedDealer ||
      isUpdating
    ) {
      return;
    }

    if (
      selectedDealer.statusCode ===
      "SUSPENDED"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `${selectedDealer.name} 딜러를 정지 처리하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");

    try {
      await withdrawCompanyDealer(
        selectedDealer.dealerId
      );

      const updatedDealer = {
        ...selectedDealer,
        statusCode:
          "SUSPENDED",
        status: "정지",
      };

      setDealers(
        (currentDealers) =>
          currentDealers.map(
            (dealer) =>
              dealer.dealerId ===
                updatedDealer.dealerId
                ? updatedDealer
                : dealer
          )
      );

      setSelectedDealer(
        updatedDealer
      );

      window.alert(
        "딜러 계정이 정지 처리되었습니다."
      );
    } catch (error) {
      console.error(
        "딜러 정지 처리 실패:",
        error
      );

      const message =
        error.message ||
        "딜러 정지 처리 중 오류가 발생했습니다.";

      setErrorMessage(message);
      window.alert(message);
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredDealers =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      return dealers.filter(
        (dealer) => {
          const searchableText = [
            dealer.name,
            dealer.loginId,
            dealer.phone,
            dealer.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const keywordMatch =
            keyword === "" ||
            searchableText.includes(
              keyword
            );

          const statusMatch =
            statusFilter ===
            "전체" ||
            dealer.status ===
            statusFilter;

          return (
            keywordMatch &&
            statusMatch
          );
        }
      );
    }, [
      dealers,
      searchText,
      statusFilter,
    ]);

  const columns =
    useMemo(
      () => [
        {
          key: "name",
          label: "딜러명",

          render: (
            dealer
          ) => (
            <div className="dealer-list-profile">
              {dealer.profileImageUrl ? (
                <img
                  src={
                    dealer.profileImageUrl
                  }
                  alt={`${dealer.name} 딜러 프로필`}
                  onError={(
                    event
                  ) => {
                    event.currentTarget.style.display =
                      "none";

                    const fallback =
                      event
                        .currentTarget
                        .nextElementSibling;

                    if (
                      fallback
                    ) {
                      fallback.style.display =
                        "flex";
                    }
                  }}
                />
              ) : null}

              <div
                className="dealer-list-profile-empty"
                style={{
                  display:
                    dealer.profileImageUrl
                      ? "none"
                      : "flex",
                }}
              >
                {String(
                  dealer.name ||
                  "딜"
                ).slice(
                  0,
                  1
                )}
              </div>

              <span>
                {
                  dealer.name
                }
              </span>
            </div>
          ),
        },
        {
          key: "loginId",
          label: "아이디",
        },
        {
          key: "phone",
          label: "연락처",
        },
        {
          key: "email",
          label: "이메일",
        },
        {
          key: "status",
          label: "상태",

          render: (
            dealer
          ) => (
            <span
              className={`manage-badge ${dealer.status}`}
            >
              {
                dealer.status
              }
            </span>
          ),
        },
        {
          key: "manage",
          label: "관리",

          render: (
            dealer,
            onRowAction
          ) => (
            <button
              type="button"
              className="small-btn"
              onClick={() =>
                onRowAction?.(
                  dealer
                )
              }
            >
              상세
            </button>
          ),
        },
      ],
      []
    );

  const filters =
    useMemo(
      () => [
        {
          name: "status",
          value:
            statusFilter,
          onChange:
            setStatusFilter,

          options: [
            {
              label:
                "전체 상태",
              value: "전체",
            },
            {
              label: "정상",
              value: "정상",
            },
            {
              label: "정지",
              value: "정지",
            },
          ],
        },
      ],
      [statusFilter]
    );

  return (
    <main className="page-container">
      <PageTitle
        title="딜러 관리"
        description="회사 소속 딜러 계정을 조회하고 상태를 관리합니다."
      />

      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>
              소속 딜러 목록
            </h3>

            <p className="admin-panel-sub-text">
              현재 회사에 등록된 딜러 계정을 DB에서 조회합니다.
            </p>
          </div>

          <div className="admin-header-action-area">
            <button
              type="button"
              className="small-btn"
              onClick={
                loadDealers
              }
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "조회 중"
                : "새로고침"}
            </button>

            <Link
              to="/company/dealers/create"
              className="admin-header-link-btn"
            >
              딜러 계정 생성
            </Link>
          </div>
        </div>

        {errorMessage && (
          <p
            className="admin-panel-sub-text"
            role="alert"
          >
            {
              errorMessage
            }
          </p>
        )}

        <AdminSearchFilter
          searchValue={
            searchText
          }
          onSearchChange={
            setSearchText
          }
          searchPlaceholder="딜러명, 아이디, 연락처, 이메일 검색"
          filters={filters}
          onReset={
            handleResetFilter
          }
        />

        <AdminTable
          columns={columns}
          data={
            isLoading
              ? []
              : filteredDealers
          }
          totalCount={
            filteredDealers.length
          }
          emptyMessage={
            isLoading
              ? "소속 딜러 목록을 불러오는 중입니다."
              : "조회된 딜러가 없습니다."
          }
          onRowAction={
            handleOpenDetail
          }
        />
      </section>

      {selectedDealer && (
        <AdminModal
          title="딜러 상세 정보"
          onClose={
            handleCloseDetail
          }
        >
          <div className="admin-detail-image-box">
            {selectedDealer.profileImageUrl ? (
              <img
                src={
                  selectedDealer.profileImageUrl
                }
                alt={`${selectedDealer.name} 딜러 프로필`}
                onError={(
                  event
                ) => {
                  event.currentTarget.style.display =
                    "none";

                  const fallback =
                    event
                      .currentTarget
                      .nextElementSibling;

                  if (
                    fallback
                  ) {
                    fallback.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            <div
              className="admin-detail-image-empty"
              style={{
                display:
                  selectedDealer.profileImageUrl
                    ? "none"
                    : "flex",
              }}
            >
              {String(
                selectedDealer.name ||
                "딜"
              ).slice(
                0,
                1
              )}
            </div>
          </div>

          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>
                딜러명
              </span>

              <strong>
                {
                  selectedDealer.name
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                아이디
              </span>

              <strong>
                {
                  selectedDealer.loginId
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                연락처
              </span>

              <strong>
                {
                  selectedDealer.phone ||
                  "-"
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                이메일
              </span>

              <strong>
                {
                  selectedDealer.email ||
                  "-"
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                등급
              </span>

              <strong>
                {
                  selectedDealer.tier ||
                  "NORMAL"
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                위험 점수
              </span>

              <strong>
                {Number(
                  selectedDealer.riskScore ||
                  0
                ).toFixed(1)}
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                상태
              </span>

              <strong>
                <span
                  className={`manage-badge ${selectedDealer.status}`}
                >
                  {
                    selectedDealer.status
                  }
                </span>
              </strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn stop"
              onClick={
                handleWithdrawDealer
              }
              disabled={
                isUpdating ||
                selectedDealer.statusCode ===
                "SUSPENDED"
              }
            >
              {isUpdating
                ? "처리 중"
                : selectedDealer.statusCode ===
                  "SUSPENDED"
                  ? "정지됨"
                  : "정지처리"}
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <button
              type="button"
              className="modal-main-btn"
              onClick={
                handleCloseDetail
              }
              disabled={
                isUpdating
              }
            >
              확인
            </button>
          </div>
        </AdminModal>
      )}
    </main>
  );
}

export default CompanyDealerManagePage;