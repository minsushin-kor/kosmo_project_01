import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import {
  getNotificationsByRole,
} from "../../data/notificationData";
import {
  prefetchRoute,
} from "../../data/routeLoaders";

function NotificationDropdown({
  loginUser,
}) {
  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false);

  const notificationRef =
    useRef(null);

  const notifications = loginUser
    ? getNotificationsByRole(
        loginUser.role
      )
    : [];

  const handleNotificationClick =
    () => {
      setIsNotificationOpen(
        (prev) => !prev
      );
    };

  const handleNotificationLinkClick =
    () => {
      setIsNotificationOpen(false);
    };

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined;
    }

    const handleClickOutside = (
      event
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isNotificationOpen]);

  return (
    <div
      className="notification-wrap"
      ref={notificationRef}
    >
      <button
        type="button"
        className="notification-btn"
        onClick={
          handleNotificationClick
        }
        aria-label="알림 목록"
        aria-expanded={
          isNotificationOpen
        }
        aria-haspopup="menu"
      >
        알림

        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length > 99
              ? "99+"
              : notifications.length}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <div
          className="notification-list"
          role="menu"
        >
          <p className="notification-title">
            알림 리스트
          </p>

          {notifications.length === 0 ? (
            <p className="notification-empty">
              알림 없음
            </p>
          ) : (
            notifications.map(
              (notification) => (
                <Link
                  key={notification.id}
                  to={notification.path}
                  role="menuitem"
                  onMouseEnter={() =>
                    prefetchRoute(
                      notification.path
                    )
                  }
                  onFocus={() =>
                    prefetchRoute(
                      notification.path
                    )
                  }
                  onTouchStart={() =>
                    prefetchRoute(
                      notification.path
                    )
                  }
                  onClick={
                    handleNotificationLinkClick
                  }
                >
                  {
                    notification.message
                  }
                </Link>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;