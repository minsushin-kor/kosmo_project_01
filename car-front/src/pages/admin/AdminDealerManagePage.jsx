import AdminAccountManagePage from "./AdminAccountManagePage";

function AdminDealerManagePage() {
  return (
    <AdminAccountManagePage
      accountType="딜러회원"
      title="딜러 관리"
      description="기업에서 생성한 소속 딜러 계정을 관리합니다."
      listTitle="딜러 목록"
      searchPlaceholder="딜러명, 이메일 검색"
      emptyMessage="조회된 딜러가 없습니다."
    />
  );
}

export default AdminDealerManagePage;
