import { AUTH_ROLES } from "./authUser";

export const COMMON_MENU_LIST = [
  {
    id: "home",
    name: "홈",
    path: "/",
  },
];

export const ROLE_MENU_LIST = {
  [AUTH_ROLES.ADMIN]: [
    {
      id: "admin",
      name: "관리자",
      path: "/admin",
    },
  ],

  [AUTH_ROLES.COMPANY]: [
    {
      id: "company-manage",
      name: "회사관리",
      path: "/company/mypage",
    },
    {
      id: "company-public",
      name: "회사 공개페이지",
      path: "/company",
    },
    {
      id: "site-notice",
      name: "공지사항",
      path: "/notices",
    },
  ],

  [AUTH_ROLES.DEALER]: [
    {
      id: "dealer-company",
      name: "회사",
      path: "/company",
    },
  ],

  [AUTH_ROLES.MEMBER]: [],
};

export function getMenusByRole(role) {
  return ROLE_MENU_LIST[role] || [];
}

export function getHeaderMenus(role) {
  if (role === AUTH_ROLES.COMPANY) {
    return getMenusByRole(role);
  }

  return [
    ...COMMON_MENU_LIST,
    ...getMenusByRole(role),
  ];
}