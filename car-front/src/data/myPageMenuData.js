import { AUTH_ROLES } from "./authUser";

export const MYPAGE_MENU_DATA = {
  [AUTH_ROLES.ADMIN]: [
    {
      id: 1,
      name: "관리자 대시보드",
      path: "/admin",
    },
    {
      id: 2,
      name: "회원 관리",
      path: "/admin/members",
    },
    {
      id: 3,
      name: "매물 관리",
      path: "/admin/cars",
    },
    {
      id: 4,
      name: "신고 관리",
      path: "/admin/reports",
    },
  ],

  [AUTH_ROLES.COMPANY]: [
    {
      id: 1,
      name: "회사 관리 대시보드",
      path: "/company/mypage",
    },
    {
      id: 2,
      name: "공개 회사 페이지",
      path: "/company",
    },
    {
      id: 3,
      name: "딜러 관리",
      path: "/company/dealers",
    },
    {
      id: 4,
      name: "딜러 계정 생성",
      path: "/company/dealers/create",
    },
    {
      id: 5,
      name: "공지사항 관리",
      path: "/company/notices",
    },
  ],

  [AUTH_ROLES.DEALER]: [
    {
      id: 1,
      name: "딜러 페이지",
      path: "/dealer",
    },
    {
      id: 2,
      name: "내 매물 관리",
      path: "/dealer/cars",
    },
    {
      id: 3,
      name: "매물 등록",
      path: "/dealer/register-car",
    },
  ],

  [AUTH_ROLES.MEMBER]: [
    {
      id: 1,
      name: "일반회원 페이지",
      path: "/member",
    },
    {
      id: 2,
      name: "차량 둘러보기",
      path: "/",
    },
  ],
};

export function getMyPageMenusByRole(role) {
  return MYPAGE_MENU_DATA[role] || [];
}