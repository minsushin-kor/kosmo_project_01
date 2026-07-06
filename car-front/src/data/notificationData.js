import { AUTH_ROLES } from "./authUser";

export const NOTIFICATION_DATA = {
  [AUTH_ROLES.ADMIN]: [
    {
      id: 1,
      message: "신고 처리 대기 건이 있습니다.",
      path: "/admin/reports",
    },
    {
      id: 2,
      message: "신규 매물 검토가 필요합니다.",
      path: "/admin/cars",
    },
    {
      id: 3,
      message: "신규 회원 가입 내역이 있습니다.",
      path: "/admin/members",
    },
  ],

  [AUTH_ROLES.COMPANY]: [
    {
      id: 1,
      message: "회사 공지사항을 확인하세요.",
      path: "/company/notices",
    },
    {
      id: 2,
      message: "회사 관리 페이지로 이동하세요.",
      path: "/company",
    },
  ],

  [AUTH_ROLES.DEALER]: [
    {
      id: 1,
      message: "등록 매물 상태를 확인하세요.",
      path: "/dealer/cars",
    },
    {
      id: 2,
      message: "신규 매물을 등록할 수 있습니다.",
      path: "/dealer/register-car",
    },
  ],

  [AUTH_ROLES.MEMBER]: [
    {
      id: 1,
      message: "관심 차량 추천 목록을 확인하세요.",
      path: "/",
    },
    {
      id: 2,
      message: "일반회원 페이지로 이동하세요.",
      path: "/member",
    },
  ],
};

export function getNotificationsByRole(role) {
  return NOTIFICATION_DATA[role] || [];
}