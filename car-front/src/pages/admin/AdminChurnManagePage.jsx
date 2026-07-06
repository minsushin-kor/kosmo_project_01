import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import { adminChurnUsers } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";

function AdminChurnManagePage() {
  const [searchText, setSearchText] = useState("");
  const [actionFilter, setActionFilter] = useState([]);
  const [riskFilter, setRiskFilter] = useState("전체");

  const handleActionFilterChange = (action) => {
    setActionFilter((prev) =>
      prev.includes(action)
        ? prev.filter((item) => item !== action)
        : [...prev, action]
    );
  };

  const handleResetFilter = () => {
    setSearchText("");
    setActionFilter([]);
    setRiskFilter("전체");
  };

  const filteredChurnUsers = adminChurnUsers.filter((user) => {
    const keywordMatch =
      user.name.includes(searchText) ||
      user.type.includes(searchText) ||
      user.action.includes(searchText);

    const actionMatch =
      actionFilter.length === 0 || actionFilter.includes(user.action);

    const riskMatch = riskFilter === "전체" || user.risk === riskFilter;

    return keywordMatch && actionMatch && riskMatch;
  });

  const columns = [
    {
      key: "type",
      label: "회원유형",
    },
    {
      key: "name",
      label: "이름",
    },
    {
      key: "recentActivity",
      label: "최근활동",
    },
    {
      key: "churnRate",
      label: "이탈확률",
    },
    {
      key: "risk",
      label: "위험등급",
      render: (user) => (
        <span className={`manage-badge ${user.risk}`}>{user.risk}</span>
      ),
    },
    {
      key: "action",
      label: "관리방안",
    },
    {
      key: "manage",
      label: "관리",
      render: () => (
        <button type="button" className="small-btn">
          관리
        </button>
      ),
    },
  ];

  const filters = [
    {
      name: "risk",
      value: riskFilter,
      onChange: setRiskFilter,
      options: [
        { label: "전체 위험도", value: "전체" },
        { label: "높음", value: "높음" },
        { label: "보통", value: "보통" },
      ],
    },
  ];

  const checkboxFilters = [
    {
      name: "action",
      label: "관리방안",
      value: actionFilter,
      onChange: handleActionFilterChange,
      options: [
        { label: "상담 필요", value: "상담 필요" },
        { label: "쿠폰 지급", value: "쿠폰 지급" },
        { label: "모니터링", value: "모니터링" },
      ],
    },
  ];

  return (
    <AdminLayout
      title="이탈 위험 관리"
      description="머신러닝 예측 결과를 기반으로 이탈 위험 회원을 관리합니다."
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>이탈 위험 회원 목록</h3>
          <button type="button">예측 결과 갱신</button>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="이름, 회원유형, 관리방안 검색"
          filters={filters}
          checkboxFilters={checkboxFilters}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={filteredChurnUsers}
          totalCount={filteredChurnUsers.length}
          emptyMessage="조회된 이탈 위험 회원이 없습니다."
        />
      </section>
    </AdminLayout>
  );
}

export default AdminChurnManagePage;