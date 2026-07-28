export const ROUTE_LOADERS = {
  home: () =>
    import("../components/common/HomeRedirect"),

  siteNotice: () =>
    import("../pages/common/SiteNoticePage"),

  login: () =>
    import("../pages/auth/LoginPage"),

  signup: () =>
    import("../pages/auth/SignUpPage"),

  forbidden: () =>
    import("../pages/auth/ForbiddenPage"),

  notFound: () =>
    import("../pages/auth/NotFoundPage"),

  memberMyPage: () =>
    import("../pages/member/MyPage"),

  memberCars: () =>
    import("../pages/member/MemberCarsPage"),

  memberAuctionBids: () =>
    import("../pages/member/MemberAuctionBidsPage"),

  memberAuctionTrade: () =>
    import("../pages/member/MemberAuctionTradePage"),

  companyMyPage: () =>
    import("../pages/company/MyPage"),

  companyPage: () =>
    import("../pages/company/CompanyPage"),

  companyCars: () =>
    import("../pages/company/CompanyCarsPage"),

  companyNotices: () =>
    import("../pages/company/CompanyNoticesPage"),

  companyCoupon: () =>
    import("../pages/company/CompanyCouponPage"),

  companyDealerManage: () =>
    import("../pages/company/CompanyDealerManagePage"),

  companyDealerCreate: () =>
    import("../pages/company/CompanyDealerCreatePage"),

  companyDealersPublic: () =>
    import("../pages/company/CompanyDealersPublicPage"),

  companyDealerCars: () =>
    import("../pages/company/CompanyDealerCarsPage"),

  dealerPage: () =>
    import("../pages/company/DealerPage"),

  carDetail: () =>
    import("../pages/car/CarDetailPage"),

  dealerRegisterCar: () =>
    import("../pages/car/DealerRegisterCarPage"),

  dealerCarManage: () =>
    import("../pages/car/DealerCarManagePage"),

  dealerAuctionBidManage: () =>
    import("../pages/auction/DealerAuctionBidManagePage"),

  adminDashboard: () =>
    import("../pages/admin/AdminDashboardPage"),

  adminMemberManage: () =>
    import("../pages/admin/AdminMemberManagePage"),

  adminCompanyManage: () =>
    import("../pages/admin/AdminCompanyManagePage"),

  adminDealerManage: () =>
    import("../pages/admin/AdminDealerManagePage"),

  adminNoticeManage: () =>
    import("../pages/admin/AdminNoticeManagePage"),

  adminCarManage: () =>
    import("../pages/admin/AdminCarManagePage"),

  adminReportManage: () =>
    import("../pages/admin/AdminReportManagePage"),

  adminChurnManage: () =>
    import("../pages/admin/AdminChurnManagePage"),

  adminFinalDealManage: () =>
    import("../pages/admin/AdminFinalDealManagePage"),

  test: () =>
    import("../pages/test/TestPage"),
};

const ROUTE_LOADERS_BY_PATH = {
  "/": ROUTE_LOADERS.home,

  "/login": ROUTE_LOADERS.login,
  "/signup": ROUTE_LOADERS.signup,
  "/forbidden": ROUTE_LOADERS.forbidden,
  "/notices": ROUTE_LOADERS.siteNotice,

  "/mypage": ROUTE_LOADERS.memberMyPage,
  "/member": ROUTE_LOADERS.memberMyPage,
  "/member/register-car":
    ROUTE_LOADERS.dealerRegisterCar,
  "/member/auction-bids":
    ROUTE_LOADERS.memberAuctionBids,

  "/company": ROUTE_LOADERS.companyPage,
  "/company/cars":
    ROUTE_LOADERS.companyCars,
  "/company/mypage":
    ROUTE_LOADERS.companyMyPage,
  "/company/notices":
    ROUTE_LOADERS.companyNotices,
  "/company/coupons":
    ROUTE_LOADERS.companyCoupon,
  "/company/dealers":
    ROUTE_LOADERS.companyDealerManage,
  "/company/dealers/create":
    ROUTE_LOADERS.companyDealerCreate,
  "/company/dealers/public":
    ROUTE_LOADERS.companyDealersPublic,

  "/dealer": ROUTE_LOADERS.dealerPage,
  "/dealer/cars":
    ROUTE_LOADERS.dealerCarManage,
  "/dealer/register-car":
    ROUTE_LOADERS.dealerRegisterCar,

  "/admin":
    ROUTE_LOADERS.adminDashboard,
  "/admin/dashboard":
    ROUTE_LOADERS.adminDashboard,
  "/admin/members":
    ROUTE_LOADERS.adminMemberManage,
  "/admin/companies":
    ROUTE_LOADERS.adminCompanyManage,
  "/admin/dealers":
    ROUTE_LOADERS.adminDealerManage,
  "/admin/notices":
    ROUTE_LOADERS.adminNoticeManage,
  "/admin/cars":
    ROUTE_LOADERS.adminCarManage,
  "/admin/final-deals":
    ROUTE_LOADERS.adminFinalDealManage,
  "/admin/reports":
    ROUTE_LOADERS.adminReportManage,
  "/admin/churn":
    ROUTE_LOADERS.adminChurnManage,
  "/admin/churn/company":
    ROUTE_LOADERS.adminChurnManage,
  "/admin/churn/dealer":
    ROUTE_LOADERS.adminChurnManage,

  "/test": ROUTE_LOADERS.test,
};

const prefetchedPaths = new Set();

export function prefetchRoute(path) {
  const loader =
    ROUTE_LOADERS_BY_PATH[path];

  if (
    !loader ||
    prefetchedPaths.has(path)
  ) {
    return;
  }

  prefetchedPaths.add(path);

  loader().catch((error) => {
    prefetchedPaths.delete(path);

    console.error(
      `라우트 미리 불러오기 실패: ${path}`,
      error
    );
  });
}