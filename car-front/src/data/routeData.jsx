import { AUTH_ROLES } from "./authUser";

import IndexPage from "../pages/home/IndexPage";

import LoginPage from "../pages/auth/LoginPage";
import ForbiddenPage from "../pages/auth/ForbiddenPage";
import NotFoundPage from "../pages/auth/NotFoundPage";

import MyPage from "../pages/member/MyPage";
import MemberPage from "../pages/member/MemberPage";

import CompanyPage from "../pages/company/CompanyPage";
import CompanyNoticesPage from "../pages/company/CompanyNoticesPage";
import DealerPage from "../pages/company/DealerPage";

import CarDetailPage from "../pages/car/CarDetailPage";
import DealerRegisterCarPage from "../pages/car/DealerRegisterCarPage";
import DealerCarManagePage from "../pages/car/DealerCarManagePage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminMemberManagePage from "../pages/admin/AdminMemberManagePage";
import AdminCarManagePage from "../pages/admin/AdminCarManagePage";
import AdminReportManagePage from "../pages/admin/AdminReportManagePage";
import AdminChurnManagePage from "../pages/admin/AdminChurnManagePage";

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
    path: "/forbidden",
    element: <ForbiddenPage />,
  },
  {
    id: 4,
    path: "/cars/:id",
    element: <CarDetailPage />,
  },
];

export const PROTECTED_ROUTES = [
  {
    id: 1,
    path: "/mypage",
    element: <MyPage />,
    allowedRoles: [
      AUTH_ROLES.ADMIN,
      AUTH_ROLES.COMPANY,
      AUTH_ROLES.DEALER,
      AUTH_ROLES.MEMBER,
    ],
  },

  {
    id: 2,
    path: "/company",
    element: <CompanyPage />,
    allowedRoles: [AUTH_ROLES.COMPANY],
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
    id: 12,
    path: "/admin/reports",
    element: <AdminReportManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
  {
    id: 13,
    path: "/admin/churn",
    element: <AdminChurnManagePage />,
    allowedRoles: [AUTH_ROLES.ADMIN],
  },
];

export const NOT_FOUND_ROUTE = {
  path: "*",
  element: <NotFoundPage />,
};