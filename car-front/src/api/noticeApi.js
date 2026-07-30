import apiClient from "./apiClient";

export function getNotices() {
  return apiClient.get("/notices");
}

export function getNoticeDetail(noticeId) {
  return apiClient.get(`/notices/${noticeId}`);
}

export function createNotice(payload) {
  return apiClient.post("/admin/notices", payload);
}

export function updateNotice(noticeId, payload) {
  return apiClient.put(`/admin/notices/${noticeId}`, payload);
}

export function deleteNotice(noticeId) {
  return apiClient.delete(`/admin/notices/${noticeId}`);
}
