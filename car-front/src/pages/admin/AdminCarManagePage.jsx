import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import { adminCars } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";

function AdminCarManagePage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const handleResetFilter = () => {
    setSearchText("");
    setStatusFilter("전체");
  };

  const filteredCars = adminCars.filter((car) => {
    const keywordMatch =
      car.name.includes(searchText) ||
      car.company.includes(searchText) ||
      car.dealer.includes(searchText);

    const statusMatch =
      statusFilter === "전체" || car.status === statusFilter;

    return keywordMatch && statusMatch;
  });

  const columns = [
    {
      key: "name",
      label: "차량명",
    },
    {
      key: "company",
      label: "소속회사",
    },
    {
      key: "dealer",
      label: "딜러",
    },
    {
      key: "price",
      label: "가격",
    },
    {
      key: "status",
      label: "상태",
      render: (car) => (
        <span className={`manage-badge ${car.status}`}>{car.status}</span>
      ),
    },
    {
      key: "manage",
      label: "관리",
      render: () => (
        <button type="button" className="small-btn">
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
        { label: "판매중", value: "판매중" },
        { label: "검토중", value: "검토중" },
        { label: "승인대기", value: "승인대기" },
        { label: "판매완료", value: "판매완료" },
      ],
    },
  ];

  return (
    <AdminLayout
      title="매물 관리"
      description="등록된 중고차 매물 상태를 확인하고 관리합니다."
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>매물 목록</h3>
          <button type="button">매물 등록</button>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="차량명, 회사명, 딜러명 검색"
          filters={filters}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={filteredCars}
          totalCount={filteredCars.length}
          emptyMessage="조회된 매물이 없습니다."
        />
      </section>
    </AdminLayout>
  );
}

export default AdminCarManagePage;