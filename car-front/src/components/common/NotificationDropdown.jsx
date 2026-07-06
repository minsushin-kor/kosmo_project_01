import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNotificationsByRole } from "../../data/notificationData";

function NotificationDropdown({ loginUser }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const notificationRef = useRef(null);

  const notifications = loginUser
    ? getNotificationsByRole(loginUser.role)
    : [];

  const handleNotificationClick = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleNotificationLinkClick = () => {
    setIsNotificationOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="notification-wrap" ref={notificationRef}>
      <button
        type="button"
        className="notification-btn"
        onClick={handleNotificationClick}
      >
        알림
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="notification-list">
          <p className="notification-title">알림 리스트</p>

          {notifications.length === 0 ? (
            <p className="notification-empty">알림 없음</p>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.path}
                onClick={handleNotificationLinkClick}
              >
                {notification.message}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;