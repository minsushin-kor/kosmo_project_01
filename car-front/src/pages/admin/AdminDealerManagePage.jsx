import AdminAccountManagePage from "./AdminAccountManagePage";

function AdminDealerManagePage() {
  return (
    <AdminAccountManagePage
      accountType="dealer"
      accountLabel="딜러회원"
      title="딜러 관리"
      description="DB에 등록된 회사 소속 딜러 계정을 관리합니다."
      listTitle="딜러 목록"
      searchPlaceholder="딜러명, 로그인 ID, 이메일, 연락처 검색"
      emptyMessage="조회된 딜러가 없습니다."
    />
  );
}

export default AdminDealerManagePage;