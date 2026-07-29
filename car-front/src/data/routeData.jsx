/* eslint-disable react-refresh/only-export-components */

import { lazy } from "react";
import {
  AUTH_ROLES,
} from "./authUser";
import {
  ROUTE_LOADERS,
} from "./routeLoaders";

// Common
const HomeRedirect = lazy(
  ROUTE_LOADERS.home
);

const SiteNoticePage = lazy(
  ROUTE_LOADERS.siteNotice
);

// Auth
const LoginPage = lazy(
  ROUTE_LOADERS.login
);

const SignUpPage = lazy(
  ROUTE_LOADERS.signup
);

const ForbiddenPage = lazy(
  ROUTE_LOADERS.forbidden
);

const NotFoundPage = lazy(
  ROUTE_LOADERS.notFound
);

// Member
const MyPage = lazy(
  ROUTE_LOADERS.memberMyPage
);

const MemberCarsPage = lazy(
  ROUTE_LOADERS.memberCars
);

const MemberAuctionBidsPage = lazy(
  ROUTE_LOADERS.memberAuctionBids
);

const MemberAuctionTradePage = lazy(
  ROUTE_LOADERS.memberAuctionTrade
);

// Company
const CompanyMyPage = lazy(
  ROUTE_LOADERS.companyMyPage
);

const CompanyPage = lazy(
  ROUTE_LOADERS.companyPage
);

const CompanyCarsPage = lazy(
  ROUTE_LOADERS.companyCars
);

const CompanyNoticesPage = lazy(
  ROUTE_LOADERS.companyNotices
);

const CompanyCouponPage = lazy(
  ROUTE_LOADERS.companyCoupon
);

const CompanyDealerManagePage = lazy(
  ROUTE_LOADERS.companyDealerManage
);

const CompanyDealerCreatePage = lazy(
  ROUTE_LOADERS.companyDealerCreate
);

const CompanyDealersPublicPage = lazy(
  ROUTE_LOADERS.companyDealersPublic
);

const CompanyDealerCarsPage = lazy(
  ROUTE_LOADERS.companyDealerCars
);

const DealerPage = lazy(
  ROUTE_LOADERS.dealerPage
);

// Car
const CarDetailPage = lazy(
  ROUTE_LOADERS.carDetail
);

const DealerRegisterCarPage = lazy(
  ROUTE_LOADERS.dealerRegisterCar
);

const DealerCarManagePage = lazy(
  ROUTE_LOADERS.dealerCarManage
);

// Auction
const DealerAuctionBidManagePage = lazy(
  ROUTE_LOADERS.dealerAuctionBidManage
);

// Admin
const AdminDashboardPage = lazy(
  ROUTE_LOADERS.adminDashboard
);

const AdminMemberManagePage = lazy(
  ROUTE_LOADERS.adminMemberManage
);

const AdminCompanyManagePage = lazy(
  ROUTE_LOADERS.adminCompanyManage
);

const AdminDealerManagePage = lazy(
  ROUTE_LOADERS.adminDealerManage
);

const AdminNoticeManagePage = lazy(
  ROUTE_LOADERS.adminNoticeManage
);

const AdminCarManagePage = lazy(
  ROUTE_LOADERS.adminCarManage
);

const AdminReportManagePage = lazy(
  ROUTE_LOADERS.adminReportManage
);

const AdminChurnManagePage = lazy(
  ROUTE_LOADERS.adminChurnManage
);

const AdminFinalDealManagePage = lazy(
  ROUTE_LOADERS.adminFinalDealManage
);

// Test
const TestPage = lazy(
  ROUTE_LOADERS.test
);

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
    id: "company-public-detail",
    path: "/companies/:companyId",
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
    element: (
      <CompanyDealersPublicPage />
    ),
  },
  {
    id: "company-dealer-cars",
    path:
      "/company/dealers/:dealerId/cars",
    element: (
      <CompanyDealerCarsPage />
    ),
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
    element: (
      <DealerAuctionBidManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "dealer-register-car",
    path: "/dealer/register-car",
    element: (
      <DealerRegisterCarPage />
    ),
    allowedRoles: [
      AUTH_ROLES.DEALER,
    ],
  },
  {
    id: "member-register-car",
    path: "/member/register-car",
    element: (
      <DealerRegisterCarPage />
    ),
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
    path: "/member/cars/:carId/bids",
    element: (
      <MemberAuctionBidsPage />
    ),
    allowedRoles: [
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: "member-auction-trades",
    path:
      "/member/auction-trades/:winnerId",
    element: (
      <MemberAuctionTradePage />
    ),
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
    element: (
      <AdminMemberManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-companies",
    path: "/admin/companies",
    element: (
      <AdminCompanyManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-dealers",
    path: "/admin/dealers",
    element: (
      <AdminDealerManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-notices",
    path: "/admin/notices",
    element: (
      <AdminNoticeManagePage />
    ),
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
    element: (
      <AdminFinalDealManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.ADMIN,
    ],
  },
  {
    id: "admin-reports",
    path: "/admin/reports",
    element: (
      <AdminReportManagePage />
    ),
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
    element: (
      <CompanyDealerManagePage />
    ),
    allowedRoles: [
      AUTH_ROLES.COMPANY,
    ],
  },
  {
    id: "company-dealer-create",
    path: "/company/dealers/create",
    element: (
      <CompanyDealerCreatePage />
    ),
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