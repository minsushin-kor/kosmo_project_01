const SITE_NOTICE_STORAGE_KEY = "carSiteNotices";
const SITE_NOTICE_CHANGE_EVENT = "car-site-notice-change";

export const DEFAULT_SITE_NOTICES = [
  {
    id: 1,
    category: "안내",
    title: "중고차 매물 등록 운영 정책 안내",
    content: "매물 등록 시 실제 차량 정보와 일치하는 내용을 입력해 주세요.",
    date: "2026-07-21",
    important: true,
  },
  {
    id: 2,
    category: "점검",
    title: "웹사이트 정기 점검 안내",
    content: "서비스 안정화를 위한 정기 점검이 진행될 예정입니다.",
    date: "2026-07-20",
    important: false,
  },
  {
    id: 3,
    category: "정책",
    title: "허위 매물 신고 및 처리 기준 안내",
    content: "허위 매물로 확인된 게시물은 관리자 검토 후 비활성화될 수 있습니다.",
    date: "2026-07-18",
    important: false,
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && window.localStorage;
}

export function getSiteNotices() {
  if (!canUseStorage()) {
    return DEFAULT_SITE_NOTICES;
  }

  try {
    const savedNotices = JSON.parse(
      window.localStorage.getItem(SITE_NOTICE_STORAGE_KEY)
    );

    if (!Array.isArray(savedNotices)) {
      return DEFAULT_SITE_NOTICES;
    }

    return savedNotices;
  } catch {
    return DEFAULT_SITE_NOTICES;
  }
}

export function saveSiteNotices(notices) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    SITE_NOTICE_STORAGE_KEY,
    JSON.stringify(notices)
  );

  window.dispatchEvent(new CustomEvent(SITE_NOTICE_CHANGE_EVENT));
}

export function getSiteNoticeChangeEventName() {
  return SITE_NOTICE_CHANGE_EVENT;
}
