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

import { getUnusedCouponCount } from "../../api/couponApi";

function NotificationDropdown({
  loginUser,
}) {
  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] = useState(false);
  const [couponCount, setCouponCount] = useState(0);

  const notificationRef =
    useRef(null);

  useEffect(() => {
    if (loginUser && loginUser.role === "ROLE_DEALER") {
      getUnusedCouponCount()
        .then((res) => {
          if (typeof res === "number") setCouponCount(res);
          else if (res && typeof res.data === "number") setCouponCount(res.data);
          else if (res && typeof res.unusedCount === "number") setCouponCount(res.unusedCount);
        })
        .catch(() => setCouponCount(0));
    }
  }, [loginUser]);

  const baseNotifications = loginUser
    ? getNotificationsByRole(
        loginUser.role
      )
    : [];

  const notifications = couponCount > 0 && loginUser?.role === "ROLE_DEALER"
    ? [
        {
          id: "coupon-notif-1",
          text: `🎁 [쿠폰함] 이탈 방지 수수료 50% 감면 쿠폰 ${couponCount}장이 보유 중입니다.`,
          path: "/company/my-page",
        },
        ...baseNotifications
      ]
    : baseNotifications;

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