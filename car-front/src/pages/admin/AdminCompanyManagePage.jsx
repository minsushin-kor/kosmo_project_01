import AdminAccountManagePage from "./AdminAccountManagePage";

function AdminCompanyManagePage() {
  return (
    <AdminAccountManagePage
      accountType="기업회원"
      title="기업 관리"
      description="가입한 기업 계정과 승인 상태를 관리합니다."
      listTitle="기업 목록"
      searchPlaceholder="기업명, 이메일 검색"
      emptyMessage="조회된 기업이 없습니다."
    />
  );
}

export default AdminCompanyManagePage;
