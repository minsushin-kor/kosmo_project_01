import { Link } from "react-router-dom";
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import { adminCars } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

function AdminCarManagePage() {
  const [cars, setCars] = useState(adminCars);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedCar, setSelectedCar] = useState(null);

  const handleResetFilter = () => {
    setSearchText("");
    setStatusFilter("전체");
  };

  const handleOpenDetail = (car) => {
    setSelectedCar(car);
  };

  const handleCloseDetail = () => {
    setSelectedCar(null);
  };

  const handleChangeCarStatus = (status) => {
    setCars((prev) =>
      prev.map((car) =>
        car.id === selectedCar.id
          ? {
              ...car,
              status: status,
            }
          : car
      )
    );

    setSelectedCar((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const filteredCars = cars.filter((car) => {
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
      render: (car) => (
        <Link to={`/cars/${car.id}`} className="admin-post-link">
          {car.name}
        </Link>
      ),
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
      render: (car, onRowAction) => (
        <button
          type="button"
          className="small-btn"
          onClick={() => onRowAction(car)}
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
          onRowAction={handleOpenDetail}
        />
      </section>

      {selectedCar && (
        <AdminModal title="매물 상세 정보" onClose={handleCloseDetail}>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>차량명</span>
              <strong>{selectedCar.name}</strong>
            </div>

            <div className="admin-detail-row">
              <span>소속회사</span>
              <strong>{selectedCar.company}</strong>
            </div>

            <div className="admin-detail-row">
              <span>딜러</span>
              <strong>{selectedCar.dealer}</strong>
            </div>

            <div className="admin-detail-row">
              <span>가격</span>
              <strong>{selectedCar.price}</strong>
            </div>

            <div className="admin-detail-row">
              <span>상태</span>
              <strong>
                <span className={`manage-badge ${selectedCar.status}`}>
                  {selectedCar.status}
                </span>
              </strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn approve"
              onClick={() => handleChangeCarStatus("판매중")}
            >
              판매중
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeCarStatus("검토중")}
            >
              검토중
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeCarStatus("승인대기")}
            >
              승인대기
            </button>

            <button
              type="button"
              className="status-btn complete"
              onClick={() => handleChangeCarStatus("판매완료")}
            >
              판매완료
            </button>
          </div>

          <div className="admin-modal-btn-area">
            <Link
              to={`/cars/${selectedCar.id}`}
              className="modal-sub-link-btn"
            >
              매물 페이지로 이동
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

export default AdminCarManagePage;