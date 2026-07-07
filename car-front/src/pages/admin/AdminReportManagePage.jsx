import { Link } from "react-router-dom";
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import { adminReports } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

function AdminReportManagePage() {
  const [reports, setReports] = useState(adminReports);
  const [searchText, setSearchText] = useState("");
  const [reasonFilter, setReasonFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedReport, setSelectedReport] = useState(null);

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

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
  };

  const handleCloseDetail = () => {
    setSelectedReport(null);
  };

  const handleChangeReportStatus = (status) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              status: status,
            }
          : report
      )
    );

    setSelectedReport((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const filteredReports = reports.filter((report) => {
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
      render: (report) => (
        <Link to={`/cars/${report.carId}`} className="admin-post-link">
          {report.target}
        </Link>
      ),
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
      render: (report, onRowAction) => (
        <button
          type="button"
          className="small-btn"
          onClick={() => onRowAction(report)}
        >
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
        { label: "반려", value: "반려" },
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
          onRowAction={handleOpenDetail}
        />
      </section>

      {selectedReport && (
        <AdminModal title="신고 상세 정보" onClose={handleCloseDetail}>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>신고대상</span>
              <strong>{selectedReport.target}</strong>
            </div>

            <div className="admin-detail-row">
              <span>신고사유</span>
              <strong>{selectedReport.reason}</strong>
            </div>

            <div className="admin-detail-row">
              <span>신고자</span>
              <strong>{selectedReport.reporter}</strong>
            </div>

            <div className="admin-detail-row">
              <span>상태</span>
              <strong>
                <span className={`manage-badge ${selectedReport.status}`}>
                  {selectedReport.status}
                </span>
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>신고일</span>
              <strong>{selectedReport.date}</strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeReportStatus("처리대기")}
            >
              처리대기
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeReportStatus("검토중")}
            >
              검토중
            </button>

            <button
              type="button"
              className="status-btn approve"
              onClick={() => handleChangeReportStatus("처리완료")}
            >
              처리완료
            </button>

            <button
              type="button"
              className="status-btn stop"
              onClick={() => handleChangeReportStatus("반려")}
            >
              반려
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <Link
              to={`/cars/${selectedReport.carId}`}
              className="modal-sub-link-btn"
            >
              신고 매물로 이동
            </Link>

            <button
              type="button"
              className="modal-main-btn"
              onClick={handleCloseDetail}
            >
              확인
            </button>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminReportManagePage;