import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import { adminMembers } from "../../data/adminData";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";

function AdminMemberManagePage() {
  const [members, setMembers] = useState(adminMembers);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedMember, setSelectedMember] = useState(null);

  const handleTypeFilterChange = (type) => {
    setTypeFilter((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const handleResetFilter = () => {
    setSearchText("");
    setTypeFilter([]);
    setStatusFilter("전체");
  };

  const handleOpenDetail = (member) => {
    setSelectedMember(member);
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
  };

  const handleChangeMemberStatus = (status) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              status: status,
            }
          : member
      )
    );

    setSelectedMember((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const filteredMembers = members.filter((member) => {
    const keywordMatch =
      member.name.includes(searchText) ||
      member.email.includes(searchText) ||
      member.type.includes(searchText);

    const typeMatch =
      typeFilter.length === 0 || typeFilter.includes(member.type);

    const statusMatch =
      statusFilter === "전체" || member.status === statusFilter;

    return keywordMatch && typeMatch && statusMatch;
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
      key: "email",
      label: "이메일",
    },
    {
      key: "status",
      label: "상태",
      render: (member) => (
        <span className={`manage-badge ${member.status}`}>
          {member.status}
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
      render: (member, onRowAction) => (
        <button
          type="button"
          className="small-btn"
          onClick={() => onRowAction(member)}
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

  const checkboxFilters = [
    {
      name: "memberType",
      label: "회원유형",
      value: typeFilter,
      onChange: handleTypeFilterChange,
      options: [
        { label: "일반회원", value: "일반회원" },
        { label: "기업회원", value: "기업회원" },
        { label: "딜러회원", value: "딜러회원" },
      ],
    },
  ];

  return (
    <AdminLayout
      title="회원 관리"
      description="일반회원, 기업회원, 딜러 계정을 관리합니다."
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>회원 목록</h3>
          <button type="button">회원 등록</button>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="이름, 이메일, 회원유형 검색"
          filters={filters}
          checkboxFilters={checkboxFilters}
          onReset={handleResetFilter}
        />

        <AdminTable
          columns={columns}
          data={filteredMembers}
          totalCount={filteredMembers.length}
          emptyMessage="조회된 회원이 없습니다."
          onRowAction={handleOpenDetail}
        />
      </section>

      {selectedMember && (
        <AdminModal title="회원 상세 정보" onClose={handleCloseDetail}>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>회원유형</span>
              <strong>{selectedMember.type}</strong>
            </div>

            <div className="admin-detail-row">
              <span>이름</span>
              <strong>{selectedMember.name}</strong>
            </div>

            <div className="admin-detail-row">
              <span>이메일</span>
              <strong>{selectedMember.email}</strong>
            </div>

            <div className="admin-detail-row">
              <span>상태</span>
              <strong>
                <span className={`manage-badge ${selectedMember.status}`}>
                  {selectedMember.status}
                </span>
              </strong>
            </div>

            <div className="admin-detail-row">
              <span>가입일</span>
              <strong>{selectedMember.joinDate}</strong>
            </div>
          </div>

          <div className="admin-status-btn-area">
            <button
              type="button"
              className="status-btn approve"
              onClick={() => handleChangeMemberStatus("정상")}
            >
              정상처리
            </button>

            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleChangeMemberStatus("승인대기")}
            >
              승인대기
            </button>

            <button
              type="button"
              className="status-btn stop"
              onClick={() => handleChangeMemberStatus("정지")}
            >
              정지처리
            </button>
          </div>

          <div className="admin-modal-btn-area">
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

export default AdminMemberManagePage;