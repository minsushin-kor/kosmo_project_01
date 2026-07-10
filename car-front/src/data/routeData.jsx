import { AUTH_ROLES } from "./authUser";

import IndexPage from "../pages/home/IndexPage";

//Auth
import LoginPage from "../pages/auth/LoginPage";
import SignUpPage from "../pages/auth/SignUpPage";
import ForbiddenPage from "../pages/auth/ForbiddenPage";
import NotFoundPage from "../pages/auth/NotFoundPage";

//member
import MyPage from "../pages/member/MyPage";
import MemberPage from "../pages/member/MemberPage";
import MemberCarsPage from "../pages/member/MemberCarsPage";
import MemberAuctionBidsPage from "../pages/member/MemberAuctionBidsPage";
import MemberAuctionTradePage from "../pages/member/MemberAuctionTradePage";

//Company
import CompanyMyPage from "../pages/company/MyPage";
import CompanyPage from "../pages/company/CompanyPage";
import CompanyCarsPage from "../pages/company/CompanyCarsPage";
import CompanyNoticesPage from "../pages/company/CompanyNoticesPage";
import CompanyDealerManagePage from "../pages/company/CompanyDealerManagePage";
import CompanyDealerCreatePage from "../pages/company/CompanyDealerCreatePage";
import CompanyDealersPublicPage from "../pages/company/CompanyDealersPublicPage";
import CompanyDealerCarsPage from "../pages/company/CompanyDealerCarsPage";
import DealerPage from "../pages/company/DealerPage";


//car
import CarDetailPage from "../pages/car/CarDetailPage";
import DealerRegisterCarPage from "../pages/car/DealerRegisterCarPage";
import DealerCarManagePage from "../pages/car/DealerCarManagePage";

//Auction
import DealerAuctionBidManagePage from "../pages/auction/DealerAuctionBidManagePage";

//Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminMemberManagePage from "../pages/admin/AdminMemberManagePage";
import AdminCarManagePage from "../pages/admin/AdminCarManagePage";
import AdminReportManagePage from "../pages/admin/AdminReportManagePage";
import AdminChurnManagePage from "../pages/admin/AdminChurnManagePage";
import AdminFinalDealManagePage from "../pages/admin/AdminFinalDealManagePage";

//test
import TestPage from "../pages/test/TestPage";

/*
  protected: false
  → 로그인 안 해도 접근 가능

  protected: true
  → 로그인 필요
  → allowedRoles에 들어있는 권한만 접근 가능
*/

export const PUBLIC_ROUTES = [
  {
    id: 1,
    path: "/",
    element: <IndexPage />,
  },
  {
    id: 2,
    path: "/login",
    element: <LoginPage />,
  },
  {
    id: 3,
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    id: 4,
    path: "/forbidden",
    element: <ForbiddenPage />,
  },
  {
    id: 5,
    path: "/cars/:id",
    element: <CarDetailPage />,
  },
  {
    id: 6,
    path: "/company",
    element: <CompanyPage />,
  },
  {
    id: 7,
    path: "/company/cars",
    element: <CompanyCarsPage />,
  },
  {
    id: 8,
    path: "/company/dealers/public",
    element: <CompanyDealersPublicPage />,
  },
  {
    id: 9,
    path: "/company/dealers/:dealerId/cars",
    element: <CompanyDealerCarsPage />,
  },
  {
    id: 10,
    path: "/members/:memberId/cars",
    element: <MemberCarsPage />,
  },
  {
    id: 11,
    path: "/test",
    element: <TestPage />,
  },
];

export const PROTECTED_ROUTES = [
  {
    id: 1,
    path: "/mypage",
    element: <MyPage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
      AUTH_ROLES.DEALER,
      AUTH_ROLES.MEMBER,
    ],
  },
  {
    id: 3,
    path: "/company/notices",
    element: <CompanyNoticesPage />,
    allowedRoles: [AUTH_ROLES.COMPANY],
  },
  {
    id: 4,
    path: "/dealer",
    element: <DealerPage />,
    allowedRoles: [AUTH_ROLES.DEALER],
  },
  {
    id: 5,
    path: "/dealer/cars",
    element: <DealerCarManagePage />,
    allowedRoles: [AUTH_ROLES.DEALER],
  },
  {
    id: 19,
    path: "/dealer/cars/:carId/bids",
    element: <DealerAuctionBidManagePage />,
    allowedRoles: [AUTH_ROLES.DEALER],
  },
  {
    id: 6,
    path: "/dealer/register-car",
    element: <DealerRegisterCarPage />,
    allowedRoles: [AUTH_ROLES.DEALER],
  },
  {
    id: 7,
    path: "/member",
    element: <MemberPage />,
    allowedRoles: [AUTH_ROLES.MEMBER],
  },
  {
    id: 20,
    path: "/member/auction-bids",
    element: <MemberAuctionBidsPage />,
    allowedRoles: [AUTH_ROLES.MEMBER],
  },
  {
    id: 8,
    path: "/admin",
    element: <AdminDashboardPage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 9,
    path: "/admin/dashboard",
    element: <AdminDashboardPage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 10,
    path: "/admin/members",
    element: <AdminMemberManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 11,
    path: "/admin/cars",
    element: <AdminCarManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 22,
    path: "/admin/final-deals",
    element: <AdminFinalDealManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 12,
    path: "/admin/reports",
    element: <AdminReportManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 13,
    path: "/admin/churn",
    element: <AdminChurnManagePage churnType="company" />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 14,
    path: "/admin/churn/company",
    element: <AdminChurnManagePage churnType="company" />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 15,
    path: "/admin/churn/dealer",
    element: <AdminChurnManagePage churnType="dealer" />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 16,
    path: "/company/dealers",
    element: <CompanyDealerManagePage />,
    allowedRoles: [AUTH_ROLES.COMPANY],
  },
  {
    id: 17,
    path: "/company/dealers/create",
    element: <CompanyDealerCreatePage />,
    allowedRoles: [AUTH_ROLES.COMPANY],
  },
  {
    id: 18,
    path: "/company/mypage",
    element: <CompanyMyPage />,
    allowedRoles: [AUTH_ROLES.COMPANY],
  },
  {
    id: 21,
    path: "/member/auction-trades/:winnerId",
    element: <MemberAuctionTradePage />,
    allowedRoles: [AUTH_ROLES.MEMBER],
  },
];

export const NOT_FOUND_ROUTE = {
  path: "*",
  element: <NotFoundPage />,
};