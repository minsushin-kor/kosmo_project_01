import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import { adminMembers } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

function AdminAccountManagePage({
  accountType,
  title,
  description,
  listTitle,
  searchPlaceholder,
  emptyMessage,
}) {
  const initialAccounts = useMemo(
    () => adminMembers.filter((member) => member.type === accountType),
    [accountType]
  );

  const [accounts, setAccounts] = useState(initialAccounts);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleResetFilter = () => {
    setSearchText("");
    setStatusFilter("전체");
  };

  const handleChangeStatus = (status) => {
    if (!selectedAccount) {
      return;
    }

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === selectedAccount.id
          ? { ...account, status }
          : account
      )
    );

    setSelectedAccount((prev) => ({
      ...prev,
      status,
    }));
  };

  const filteredAccounts = accounts.filter((account) => {
    const keyword = searchText.trim().toLowerCase();
    const keywordMatch =
      keyword.length === 0 ||
      account.name.toLowerCase().includes(keyword) ||
      account.email.toLowerCase().includes(keyword);

    const statusMatch =
      statusFilter === "전체" || account.status === statusFilter;

    return keywordMatch && statusMatch;
  });

  const columns = [
    { key: "name", label: accountType === "기업회원" ? "기업명" : "이름" },
    { key: "email", label: "이메일" },
    {
      key: "status",
      label: "상태",
      render: (account) => (
        <span className={`manage-badge ${account.status}`}>
          {account.status}
        </span>
      ),
    },
    { key: "joinDate", label: "가입일" },
    {
      key: "manage",
      label: "관리",
      render: (account, onRowAction) => (
        <button
          type="button"
          className="small-btn"
          onClick={() => onRowAction(account)}
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
      onChange: setStatusFilter,
      options: [
        { label: "전체 상태", value: "전체" },
        { label: "정상", value: "정상" },
        { label: "승인대기", value: "승인대기" },
        { label: "정지", value: "정지" },
      ],
    },
  ];

  return (
    <AdminLayout title={title} description={description}>
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>{listTitle}</h3>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          checkboxFilters={[]}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={filteredAccounts}
          totalCount={filteredAccounts.length}
          emptyMessage={emptyMessage}
          onRowAction={setSelectedAccount}
        />
      </section>

      {selectedAccount && (
        <AdminModal
          title={`${title} 상세 정보`}
          onClose={() => setSelectedAccount(null)}
        >
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>계정유형</span>
              <strong>{selectedAccount.type}</strong>
            </div>
            <div className="admin-detail-row">
              <span>{accountType === "기업회원" ? "기업명" : "이름"}</span>
              <strong>{selectedAccount.name}</strong>
            </div>
            <div className="admin-detail-row">
              <span>이메일</span>
              <strong>{selectedAccount.email}</strong>
            </div>
            <div className="admin-detail-row">
              <span>상태</span>
              <strong>
                <span className={`manage-badge ${selectedAccount.status}`}>
                  {selectedAccount.status}
                </span>
              </strong>
            </div>
            <div className="admin-detail-row">
              <span>가입일</span>
              <strong>{selectedAccount.joinDate}</strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn approve"
              onClick={() => handleChangeStatus("정상")}
            >
              정상처리
            </button>
            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeStatus("승인대기")}
            >
              승인대기
            </button>
            <button
              type="button"
              className="status-btn stop"
              onClick={() => handleChangeStatus("정지")}
            >
              정지처리
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <button
              type="button"
              className="modal-main-btn"
              onClick={() => setSelectedAccount(null)}
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
