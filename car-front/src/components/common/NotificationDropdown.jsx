import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prefetchRoute } from "../../data/routeLoaders";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../../api/notificationApi";

function NotificationDropdown({ loginUser }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef(null);

  // 알림 데이터 불러오기 (DB 실시간 알림)
  const fetchNotifications = () => {
    if (!loginUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 안 읽은 개수 및 알림 목록 조회
    getUnreadNotificationCount()
      .then((res) => {
        const count = typeof res === "number" ? res : (res?.unreadCount || res?.data?.unreadCount || 0);
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));

    getMyNotifications()
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setNotifications(list);
      })
      .catch(() => setNotifications([]));
  };

  useEffect(() => {
    fetchNotifications();
    // 30초마다 알림 자동 갱신
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [loginUser]);

  const handleNotificationClick = () => {
    setIsNotificationOpen((prev) => !prev);
    if (!isNotificationOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationLinkClick = async (notif) => {
    setIsNotificationOpen(false);
    if (notif?.notificationId && !notif.isRead) {
      try {
        await markNotificationAsRead(notif.notificationId);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    if (!isNotificationOpen) return undefined;

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationOpen]);

  // 알림 클릭 시 이동할 페이지 URL 매핑
  const getTargetLink = (notif) => {
    if (notif.type === "COUPON_ISSUED" || notif.type === "GOLDEN_BADGE_AWARDED" || notif.type === "GOLDEN_BADGE_REVOKED") {
      return loginUser?.role === "ROLE_DEALER" ? "/dealer/cars" : "/company/my-page";
    }
    if (notif.referenceId) {
      return `/cars/${notif.referenceId}`;
    }
    return "/";
  };

  return (
    <div className="notification-wrap" ref={notificationRef}>
      <button
        type="button"
        className="notification-btn"
        onClick={handleNotificationClick}
        aria-label="알림 목록"
        aria-expanded={isNotificationOpen}
        aria-haspopup="menu"
      >
        알림
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="notification-list" role="menu">
          <p className="notification-title">알림 리스트</p>

          {notifications.length === 0 ? (
            <p className="notification-empty">새로운 알림이 없습니다.</p>
          ) : (
            notifications.map((notif) => {
              const targetPath = getTargetLink(notif);
              return (
                <Link
                  key={notif.notificationId || notif.id}
                  to={targetPath}
                  role="menuitem"
                  style={{
                    fontWeight: notif.isRead ? "normal" : "bold",
                    opacity: notif.isRead ? 0.7 : 1,
                  }}
                  onMouseEnter={() => prefetchRoute(targetPath)}
                  onFocus={() => prefetchRoute(targetPath)}
                  onTouchStart={() => prefetchRoute(targetPath)}
                  onClick={() => handleNotificationLinkClick(notif)}
                >
                  {notif.message || notif.text}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;