import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import {
  getAdminAccounts,
  updateAdminAccountStatus,
} from "../../api/adminAccountApi";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

const STATUS_LABEL_MAP = {
  ACTIVE: "정상",
  INACTIVE: "비활성",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

const STATUS_CLASS_MAP = {
  ACTIVE: "정상",
  INACTIVE: "승인대기",
  SUSPENDED: "정지",
  WITHDRAWN: "정지",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeAccount(account) {
  const status = String(
    account.status || "ACTIVE"
  ).toUpperCase();

  return {
    id: account.id,
    name: account.name || "-",
    loginId: account.loginId || "-",
    email: account.email || "-",
    phone: account.phone || "-",
    status,
    statusLabel:
      STATUS_LABEL_MAP[status] || status,
    role: account.role || "",
    createdAt: account.createdAt || null,
    joinDate: formatDate(account.createdAt),

    dealerCount: Number(
      account.dealerCount || 0
    ),

    companyId:
      account.companyId ?? null,

    companyName:
      account.companyName || "-",
  };
}

function AdminAccountManagePage({
  accountType,
  accountLabel,
  title,
  description,
  listTitle,
  searchPlaceholder,
  emptyMessage,
}) {
  const [accounts, setAccounts] =
    useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [
    selectedAccount,
    setSelectedAccount,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadAccounts = useCallback(
    async ({
      query = searchText,
      status = statusFilter,
    } = {}) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result =
          await getAdminAccounts({
            accountType,
            query,
            status,
            page: 0,
            size: 100,
          });

        setAccounts(
          result.content.map(
            normalizeAccount
          )
        );
      } catch (error) {
        console.error(
          `${title} 목록 조회 실패:`,
          error
        );

        setAccounts([]);

        setErrorMessage(
          error.message ||
          `${title} 목록을 불러오지 못했습니다.`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      accountType,
      searchText,
      statusFilter,
      title,
    ]
  );

  useEffect(() => {
    let isActive = true;

    getAdminAccounts({
      accountType,
      page: 0,
      size: 100,
    })
      .then((result) => {
        if (!isActive) {
          return;
        }

        setAccounts(
          result.content.map(
            normalizeAccount
          )
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.error(
          `${title} 목록 조회 실패:`,
          error
        );

        setAccounts([]);

        setErrorMessage(
          error.message ||
          `${title} 목록을 불러오지 못했습니다.`
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accountType, title]);

  function handleResetFilter() {
    setSearchText("");
    setStatusFilter("ALL");

    loadAccounts({
      query: "",
      status: "ALL",
    });
  }

  async function handleSearchSubmit() {
    await loadAccounts();
  }

  async function handleChangeStatus(status) {
    if (
      !selectedAccount ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await updateAdminAccountStatus({
        accountType,
        accountId:
          selectedAccount.id,
        status,
      });

      const updatedAccount = {
        ...selectedAccount,
        status,
        statusLabel:
          STATUS_LABEL_MAP[status] ||
          status,
      };

      setSelectedAccount(
        updatedAccount
      );

      setAccounts((previous) =>
        previous.map((account) =>
          account.id ===
            updatedAccount.id
            ? updatedAccount
            : account
        )
      );

      await loadAccounts();
    } catch (error) {
      console.error(
        `${title} 상태 변경 실패:`,
        error
      );

      setErrorMessage(
        error.message ||
        "계정 상태를 변경하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const filteredAccounts =
    useMemo(() => {
      const keyword = searchText
        .trim()
        .toLowerCase();

      return accounts.filter(
        (account) => {
          const keywordMatch =
            keyword.length === 0 ||
            account.name
              .toLowerCase()
              .includes(keyword) ||
            account.loginId
              .toLowerCase()
              .includes(keyword) ||
            account.email
              .toLowerCase()
              .includes(keyword) ||
            account.phone
              .toLowerCase()
              .includes(keyword) ||
            account.companyName
              .toLowerCase()
              .includes(keyword);

          const statusMatch =
            statusFilter === "ALL" ||
            account.status ===
            statusFilter;

          return (
            keywordMatch &&
            statusMatch
          );
        }
      );
    }, [
      accounts,
      searchText,
      statusFilter,
    ]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "name",
        label:
          accountType === "company"
            ? "기업명"
            : "이름",

        render: (account) => {
          if (
            accountType === "company"
          ) {
            return (
              <Link
                to={`/companies/${account.id}`}
                className="admin-post-link"
              >
                {account.name}
              </Link>
            );
          }

          if (
            accountType === "dealer"
          ) {
            return (
              <Link
                to={`/company/dealers/${account.id}`}
                className="admin-post-link"
              >
                {account.name}
              </Link>
            );
          }

          return account.name;
        },
      },
      {
        key: "loginId",
        label: "로그인 ID",
      },
      {
        key: "email",
        label: "이메일",
      },
      {
        key: "phone",
        label: "연락처",
      },
    ];

    if (accountType === "company") {
      baseColumns.push({
        key: "dealerCount",
        label: "소속 딜러",
        render: (account) =>
          `${account.dealerCount.toLocaleString(
            "ko-KR"
          )}명`,
      });
    }

    if (accountType === "dealer") {
      baseColumns.push({
        key: "companyName",
        label: "소속 회사",
        render: (account) => {
          if (!account.companyId) {
            return "-";
          }

          return (
            <Link
              to={`/companies/${account.companyId}`}
              className="admin-post-link"
            >
              {account.companyName}
            </Link>
          );
        },
      });
    }

    baseColumns.push(
      {
        key: "status",
        label: "상태",
        render: (account) => (
          <span
            className={`manage-badge ${STATUS_CLASS_MAP[
              account.status
              ] || ""
              }`}
          >
            {account.statusLabel}
          </span>
        ),
      },
      {
        key: "joinDate",
        label: "가입일",
      },
      {
        key: "manage",
        label: "관리",
        render: (
          account,
          onRowAction
        ) => (
          <button
            type="button"
            className="small-btn"
            onClick={() =>
              onRowAction(account)
            }
          >
            상세
          </button>
        ),
      }
    );

    return baseColumns;
  }, [accountType]);

  const filters = useMemo(
    () => [
      {
        name: "status",
        value: statusFilter,
        onChange:
          setStatusFilter,
        options: [
          {
            label: "전체 상태",
            value: "ALL",
          },
          {
            label: "정상",
            value: "ACTIVE",
          },
          {
            label: "비활성",
            value: "INACTIVE",
          },
          {
            label: "정지",
            value: "SUSPENDED",
          },
          {
            label: "탈퇴",
            value: "WITHDRAWN",
          },
        ],
      },
    ],
    [statusFilter]
  );

  return (
    <AdminLayout
      title={title}
      description={description}
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <div>
            <h3>{listTitle}</h3>

            <p className="admin-panel-sub-text">
              DB에 저장된 계정 정보를
              조회합니다.
            </p>
          </div>

          <button
            type="button"
            className="small-btn"
            onClick={() =>
              loadAccounts()
            }
            disabled={isLoading}
          >
            {isLoading
              ? "조회 중"
              : "새로고침"}
          </button>
        </div>

        {errorMessage && (
          <p
            className="admin-panel-sub-text"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={
            setSearchText
          }
          searchPlaceholder={
            searchPlaceholder
          }
          filters={filters}
          checkboxFilters={[]}
          onReset={
            handleResetFilter
          }
        />

        <div className="admin-filter-action-area">
          <button
            type="button"
            className="small-btn"
            onClick={
              handleSearchSubmit
            }
            disabled={isLoading}
          >
            조회
          </button>
        </div>

        <AdminTable
          columns={columns}
          data={
            isLoading
              ? []
              : filteredAccounts
          }
          totalCount={
            filteredAccounts.length
          }
          emptyMessage={
            isLoading
              ? "계정 목록을 불러오는 중입니다."
              : emptyMessage
          }
          onRowAction={
            setSelectedAccount
          }
        />
      </section>

      {selectedAccount && (
        <AdminModal
          title={`${title} 상세 정보`}
          onClose={() =>
            setSelectedAccount(null)
          }
        >
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>계정 유형</span>

              <strong>
                {accountLabel}
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>
                {accountType ===
                  "company"
                  ? "기업명"
                  : "이름"}
              </span>

              <strong>
                {selectedAccount.name}
              </strong>
            </div>

            {accountType ===
              "company" && (
                <div className="admin-detail-row">
                  <span>소속 딜러</span>

                  <strong>
                    {selectedAccount.dealerCount.toLocaleString(
                      "ko-KR"
                    )}
                    명
                  </strong>
                </div>
              )}

            {accountType ===
              "dealer" && (
                <div className="admin-detail-row">
                  <span>소속 회사</span>

                  <strong>
                    {selectedAccount.companyId ? (
                      <Link
                        to={`/companies/${selectedAccount.companyId}`}
                        className="admin-post-link"
                      >
                        {
                          selectedAccount.companyName
                        }
                      </Link>
                    ) : (
                      "-"
                    )}
                  </strong>
                </div>
              )}

            <div className="admin-detail-row">
              <span>로그인 ID</span>

              <strong>
                {
                  selectedAccount.loginId
                }
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>이메일</span>

              <strong>
                {selectedAccount.email}
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>연락처</span>

              <strong>
                {selectedAccount.phone}
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>상태</span>

              <strong>
                <span
                  className={`manage-badge ${STATUS_CLASS_MAP[
                    selectedAccount
                      .status
                    ] || ""
                    }`}
                >
                  {
                    selectedAccount
                      .statusLabel
                  }
                </span>
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>가입일</span>

              <strong>
                {
                  selectedAccount.joinDate
                }
              </strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn approve"
              onClick={() =>
                handleChangeStatus(
                  "ACTIVE"
                )
              }
              disabled={isSaving}
            >
              정상 처리
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() =>
                handleChangeStatus(
                  "INACTIVE"
                )
              }
              disabled={isSaving}
            >
              비활성 처리
            </button>

            {accountType !==
              "company" && (
                <button
                  type="button"
                  className="status-btn stop"
                  onClick={() =>
                    handleChangeStatus(
                      "SUSPENDED"
                    )
                  }
                  disabled={isSaving}
                >
                  정지 처리
                </button>
              )}
          </div>

          <div className="admin-modal-btn-area">
            <button
              type="button"
              className="modal-main-btn"
              onClick={() =>
                setSelectedAccount(null)
              }
              disabled={isSaving}
            >
              확인
            </button>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminAccountManagePage;