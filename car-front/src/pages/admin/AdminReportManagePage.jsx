import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import { adminReports } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";

function AdminReportManagePage() {
  const [searchText, setSearchText] = useState("");
  const [reasonFilter, setReasonFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");

  const handleReasonFilterChange = (reason) => {
    setReasonFilter((prev) =>
      prev.includes(reason)
        ? prev.filter((item) => item !== reason)
        : [...prev, reason]
    );
  };

  const handleResetFilter = () => {
    setSearchText("");
    setReasonFilter([]);
    setStatusFilter("전체");
  };

  const filteredReports = adminReports.filter((report) => {
    const keywordMatch =
      report.target.includes(searchText) ||
      report.reason.includes(searchText) ||
      report.reporter.includes(searchText);

    const reasonMatch =
      reasonFilter.length === 0 || reasonFilter.includes(report.reason);

    const statusMatch =
      statusFilter === "전체" || report.status === statusFilter;

    return keywordMatch && reasonMatch && statusMatch;
  });

  const columns = [
    {
      key: "target",
      label: "신고대상",
    },
    {
      key: "reason",
      label: "신고사유",
    },
    {
      key: "reporter",
      label: "신고자",
    },
    {
      key: "status",
      label: "상태",
      render: (report) => (
        <span className={`manage-badge ${report.status}`}>
          {report.status}
        </span>
      ),
    },
    {
      key: "date",
      label: "신고일",
    },
    {
      key: "manage",
      label: "관리",
      render: () => (
        <button type="button" className="small-btn">
          처리
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
        { label: "처리대기", value: "처리대기" },
        { label: "검토중", value: "검토중" },
        { label: "처리완료", value: "처리완료" },
      ],
    },
  ];

  const checkboxFilters = [
    {
      name: "reportReason",
      label: "신고사유",
      value: reasonFilter,
      onChange: handleReasonFilterChange,
      options: [
        { label: "허위 매물 의심", value: "허위 매물 의심" },
        { label: "가격 정보 불일치", value: "가격 정보 불일치" },
        { label: "이미 판매된 차량", value: "이미 판매된 차량" },
      ],
    },
  ];

  return (
    <AdminLayout
      title="신고 관리"
      description="허위 매물, 가격 오류, 부적절한 게시물을 검토합니다."
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>신고 목록</h3>
          <button type="button">처리 기준 보기</button>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="신고대상, 신고사유, 신고자 검색"
          filters={filters}
          checkboxFilters={checkboxFilters}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={filteredReports}
          totalCount={filteredReports.length}
          emptyMessage="조회된 신고가 없습니다."
        />
      </section>
    </AdminLayout>
  );
}

export default AdminReportManagePage;