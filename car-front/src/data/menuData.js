import { AUTH_ROLES } from "./authUser";

export const COMMON_MENU_LIST = [
  {
    id: 1,
    name: "홈",
    path: "/",
  },
];

export const ROLE_MENU_LIST = {
  [AUTH_ROLES.ADMIN]: [
    {
      id: 1,
      name: "관리자",
      path: "/admin",
    },
  ],

  [AUTH_ROLES.COMPANY]: [
    {
      id: 1,
      name: "회사",
      path: "/company",
    },
  ],

  [AUTH_ROLES.DEALER]: [
    {
      id: 1,
      name: "딜러",
      path: "/dealer",
    },
  ],

  [AUTH_ROLES.MEMBER]: [
    {
      id: 1,
      name: "일반회원",
      path: "/member",
    },
  ],
};

export function getMenusByRole(role) {
  return ROLE_MENU_LIST[role] || [];
}

export function getHeaderMenus(role) {
  return [...COMMON_MENU_LIST, ...getMenusByRole(role)];
}