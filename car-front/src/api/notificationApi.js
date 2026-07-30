import apiClient from "./apiClient";

// 내 실시간 알림 목록 조회
export function getMyNotifications() {
  return apiClient.get("/notifications");
}

// 안 읽은 알림 개수 조회
export function getUnreadNotificationCount() {
  return apiClient.get("/notifications/unread-count");
}

// 알림 읽음 처리
export function markNotificationAsRead(notificationId) {
  return apiClient.patch(`/notifications/${notificationId}/read`);
}
