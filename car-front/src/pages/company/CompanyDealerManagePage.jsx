import {
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
  companyDealers,
} from "../../data/companyData";
import {
  getCompanyDealersFromStorage,
  updateCompanyDealerStatus,
} from "../../utils/companyDealerStorage";
import "../../css/common/page.css";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

function getInitialDealers() {
  const storageDealers =
    getCompanyDealersFromStorage();

  return [
    ...storageDealers,
    ...companyDealers,
  ];
}

function CompanyDealerManagePage() {
  /*
   * 첫 렌더링 시 딜러 목록을 바로 생성합니다.
   *
   * 기존처럼 빈 배열로 먼저 렌더링한 뒤
   * useEffect에서 setDealers를 실행하지 않으므로
   * 불필요한 추가 렌더링이 발생하지 않습니다.
   */
  const [
    dealers,
    setDealers,
  ] = useState(getInitialDealers);

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

  const handleResetFilter = () => {
    setSearchText("");
    setStatusFilter("전체");
  };

  const handleOpenDetail = (
    dealer
  ) => {
    setSelectedDealer(dealer);
  };

  const handleCloseDetail = () => {
    setSelectedDealer(null);
  };

  const handleChangeDealerStatus = (
    status
  ) => {
    if (!selectedDealer) {
      return;
    }

    const selectedDealerId =
      selectedDealer.id;

    setDealers((prevDealers) =>
      prevDealers.map(
        (dealer) =>
          String(dealer.id) ===
          String(selectedDealerId)
            ? {
                ...dealer,
                status,
              }
            : dealer
      )
    );

    setSelectedDealer(
      (prevDealer) => {
        if (!prevDealer) {
          return null;
        }

        return {
          ...prevDealer,
          status,
        };
      }
    );

    updateCompanyDealerStatus(
      selectedDealerId,
      status
    );
  };

  const filteredDealers =
    useMemo(() => {
      const keyword =
        searchText
          .trim()
          .toLowerCase();

      return dealers.filter(
        (dealer) => {
          const name =
            String(
              dealer.name || ""
            ).toLowerCase();

          const loginId =
            String(
              dealer.loginId || ""
            ).toLowerCase();

          const phone =
            String(
              dealer.phone || ""
            ).toLowerCase();

          const email =
            String(
              dealer.email || ""
            ).toLowerCase();

          const keywordMatch =
            keyword === "" ||
            name.includes(keyword) ||
            loginId.includes(
              keyword
            ) ||
            phone.includes(keyword) ||
            email.includes(keyword);

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

  const columns = [
    {
      key: "name",
      label: "딜러명",

      render: (dealer) => (
        <div className="dealer-list-profile">
          {dealer.imagePreviewUrl ? (
            <img
              src={
                dealer.imagePreviewUrl
              }
              alt="딜러 이미지"
            />
          ) : (
            <div className="dealer-list-profile-empty">
              {String(
                dealer.name || "딜"
              ).slice(0, 1)}
            </div>
          )}

          <span>
            {dealer.name}
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
      key: "carCount",
      label: "등록 매물",

      render: (dealer) =>
        `${Number(
          dealer.carCount || 0
        )}대`,
    },
    {
      key: "soldCount",
      label: "판매 완료",

      render: (dealer) =>
        `${Number(
          dealer.soldCount || 0
        )}대`,
    },
    {
      key: "status",
      label: "상태",

      render: (dealer) => (
        <span
          className={`manage-badge ${dealer.status}`}
        >
          {dealer.status}
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
  ];

  const filters = [
    {
      name: "status",
      value: statusFilter,
      onChange:
        setStatusFilter,

      options: [
        {
          label: "전체 상태",
          value: "전체",
        },
        {
          label: "정상",
          value: "정상",
        },
        {
          label: "승인대기",
          value: "승인대기",
        },
        {
          label: "정지",
          value: "정지",
        },
      ],
    },
  ];

  return (
    <main className="page-container">
      <PageTitle
        title="딜러 관리"
        description="회사 소속 딜러 계정을 조회하고 상태를 관리합니다."
      />

      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>
            소속 딜러 목록
          </h3>

          <Link
            to="/company/dealers/create"
            className="admin-header-link-btn"
          >
            딜러 계정 생성
          </Link>
        </div>

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
          data={filteredDealers}
          totalCount={
            filteredDealers.length
          }
          emptyMessage="조회된 딜러가 없습니다."
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
            {selectedDealer.imagePreviewUrl ? (
              <img
                src={
                  selectedDealer.imagePreviewUrl
                }
                alt="딜러 이미지"
              />
            ) : (
              <div className="admin-detail-image-empty">
                {String(
                  selectedDealer.name ||
                    "딜"
                ).slice(0, 1)}
              </div>
            )}
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
                  selectedDealer.phone
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                이메일
              </span>

              <strong>
                {
                  selectedDealer.email
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                등록 매물
              </span>

              <strong>
                {Number(
                  selectedDealer.carCount ||
                    0
                )}
                대
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                판매 완료
              </span>

              <strong>
                {Number(
                  selectedDealer.soldCount ||
                    0
                )}
                대
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

            <div className="admin-detail-row">
              <span>
                등록일
              </span>

              <strong>
                {
                  selectedDealer.joinDate
                }
              </strong>
            </div>

            {selectedDealer.memo && (
              <div className="admin-detail-row">
                <span>
                  메모
                </span>

                <strong>
                  {
                    selectedDealer.memo
                  }
                </strong>
              </div>
            )}
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn approve"
              onClick={() =>
                handleChangeDealerStatus(
                  "정상"
                )
              }
            >
              정상처리
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() =>
                handleChangeDealerStatus(
                  "승인대기"
                )
              }
            >
              승인대기
            </button>

            <button
              type="button"
              className="status-btn stop"
              onClick={() =>
                handleChangeDealerStatus(
                  "정지"
                )
              }
            >
              정지처리
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <button
              type="button"
              className="modal-main-btn"
              onClick={
                handleCloseDetail
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