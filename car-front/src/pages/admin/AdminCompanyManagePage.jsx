import AdminAccountManagePage from "./AdminAccountManagePage";

function AdminCompanyManagePage() {
  return (
    <AdminAccountManagePage
      accountType="company"
      accountLabel="기업회원"
      title="기업 관리"
      description="DB에 등록된 기업 계정과 이용 상태를 관리합니다."
      listTitle="기업 목록"
      searchPlaceholder="기업명, 로그인 ID, 이메일, 연락처 검색"
      emptyMessage="조회된 기업이 없습니다."
    />
  );
}

export default AdminCompanyManagePage;