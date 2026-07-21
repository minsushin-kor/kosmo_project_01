import AdminAccountManagePage from "./AdminAccountManagePage";

function AdminMemberManagePage() {
  return (
    <AdminAccountManagePage
      accountType="일반회원"
      title="회원 관리"
      description="일반회원 계정과 이용 상태를 관리합니다."
      listTitle="회원 목록"
      searchPlaceholder="이름, 이메일 검색"
      emptyMessage="조회된 회원이 없습니다."
    />
  );
}

export default AdminMemberManagePage;
