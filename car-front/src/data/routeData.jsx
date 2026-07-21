import {
  AUTH_ROLES,
} from "./authUser";

// Common
import HomeRedirect from "../components/common/HomeRedirect";
import SiteNoticePage from "../pages/common/SiteNoticePage";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import SignUpPage from "../pages/auth/SignUpPage";
import ForbiddenPage from "../pages/auth/ForbiddenPage";
import NotFoundPage from "../pages/auth/NotFoundPage";

// Member
import MyPage from "../pages/member/MyPage";
import MemberCarsPage from "../pages/member/MemberCarsPage";
import MemberAuctionBidsPage from "../pages/member/MemberAuctionBidsPage";
import MemberAuctionTradePage from "../pages/member/MemberAuctionTradePage";

// Company
import CompanyMyPage from "../pages/company/MyPage";
import CompanyPage from "../pages/company/CompanyPage";
import CompanyCarsPage from "../pages/company/CompanyCarsPage";
import CompanyNoticesPage from "../pages/company/CompanyNoticesPage";
import CompanyCouponPage from "../pages/company/CompanyCouponPage";
import CompanyDealerManagePage from "../pages/company/CompanyDealerManagePage";
import CompanyDealerCreatePage from "../pages/company/CompanyDealerCreatePage";
import CompanyDealersPublicPage from "../pages/company/CompanyDealersPublicPage";
import CompanyDealerCarsPage from "../pages/company/CompanyDealerCarsPage";
import DealerPage from "../pages/company/DealerPage";

// Car
import CarDetailPage from "../pages/car/CarDetailPage";
import DealerRegisterCarPage from "../pages/car/DealerRegisterCarPage";
import DealerCarManagePage from "../pages/car/DealerCarManagePage";

// Auction
import DealerAuctionBidManagePage from "../pages/auction/DealerAuctionBidManagePage";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminMemberManagePage from "../pages/admin/AdminMemberManagePage";
import AdminCompanyManagePage from "../pages/admin/AdminCompanyManagePage";
import AdminDealerManagePage from "../pages/admin/AdminDealerManagePage";
import AdminNoticeManagePage from "../pages/admin/AdminNoticeManagePage";
import AdminCarManagePage from "../pages/admin/AdminCarManagePage";
import AdminReportManagePage from "../pages/admin/AdminReportManagePage";
import AdminChurnManagePage from "../pages/admin/AdminChurnManagePage";
import AdminFinalDealManagePage from "../pages/admin/AdminFinalDealManagePage";

// Test
import TestPage from "../pages/test/TestPage";

export const PUBLIC_ROUTES = [
  {
    id: "home",
    path: "/",
    element: <HomeRedirect />,
  },
  {
    id: "login",
    path: "/login",
    element: <LoginPage />,
  },
  {
    id: "signup",
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    id: "forbidden",
    path: "/forbidden",
    element: <ForbiddenPage />,
  },
  {
    id: "site-notices",
    path: "/notices",
    element: <SiteNoticePage />,
  },
  {
    id: "car-detail",
    path: "/cars/:id",
    element: <CarDetailPage />,
  },
  {
    id: "company-public",
    path: "/company",
    element: <CompanyPage />,
  },
  {
    id: "company-cars",
    path: "/company/cars",
    element: <CompanyCarsPage />,
  },
  {
    id: "company-dealers-public",
    path: "/company/dealers/public",
    element: <CompanyDealersPublicPage />,
  },
  {
    id: "company-dealer-cars",
    path: "/company/dealers/:dealerId/cars",
    element: <CompanyDealerCarsPage />,
  },
  {
    id: "member-cars",
    path: "/members/:memberId/cars",
    element: <MemberCarsPage />,
  },
  {
    id: "company-dealer-public-detail",
    path: "/company/dealers/:dealerId",
    element: <DealerPage />,
  },
  {
    id: "test",
    path: "/test",
    element: <TestPage />,
  },
];

export const PROTECTED_ROUTES = [
  {
    id: "mypage",
    path: "/mypage",
    element: <MyPage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "company-notice-manage",
    path: "/company/notices",
    element: <CompanyNoticesPage />,
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
  {
    id: "company-coupons",
    path: "/company/coupons",
    element: <CompanyCouponPage />,
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
  {
    id: "dealer-page",
    path: "/dealer",
    element: <DealerPage />,
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "dealer-cars",
    path: "/dealer/cars",
    element: <DealerCarManagePage />,
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "dealer-car-bids",
    path: "/dealer/cars/:carId/bids",
    element: <DealerAuctionBidManagePage />,
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "dealer-register-car",
    path: "/dealer/register-car",
    element: <DealerRegisterCarPage />,
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "member-register-car",
    path: "/member/register-car",
    element: <DealerRegisterCarPage />,
    allowedRoles: [
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "member-page",
    path: "/member",
    element: <MyPage />,
    allowedRoles: [
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "member-auction-bids",
    path: "/member/auction-bids",
    element: <MemberAuctionBidsPage />,
    allowedRoles: [
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "member-auction-trades",
    path: "/member/auction-trades/:winnerId",
    element: <MemberAuctionTradePage />,
    allowedRoles: [
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "admin",
    path: "/admin",
    element: <AdminDashboardPage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-dashboard",
    path: "/admin/dashboard",
    element: <AdminDashboardPage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-members",
    path: "/admin/members",
    element: <AdminMemberManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-companies",
    path: "/admin/companies",
    element: <AdminCompanyManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-dealers",
    path: "/admin/dealers",
    element: <AdminDealerManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-notices",
    path: "/admin/notices",
    element: <AdminNoticeManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-cars",
    path: "/admin/cars",
    element: <AdminCarManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-final-deals",
    path: "/admin/final-deals",
    element: <AdminFinalDealManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-reports",
    path: "/admin/reports",
    element: <AdminReportManagePage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-churn",
    path: "/admin/churn",
    element: (
      <AdminChurnManagePage
        churnType="company"
      />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-company-churn",
    path: "/admin/churn/company",
    element: (
      <AdminChurnManagePage
        churnType="company"
      />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-dealer-churn",
    path: "/admin/churn/dealer",
    element: (
      <AdminChurnManagePage
        churnType="dealer"
      />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "company-dealers",
    path: "/company/dealers",
    element: <CompanyDealerManagePage />,
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
  {
    id: "company-dealer-create",
    path: "/company/dealers/create",
    element: <CompanyDealerCreatePage />,
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
  {
    id: "company-mypage",
    path: "/company/mypage",
    element: <CompanyMyPage />,
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
];

export const NOT_FOUND_ROUTE = {
  path: "*",
  element: <NotFoundPage />,
};