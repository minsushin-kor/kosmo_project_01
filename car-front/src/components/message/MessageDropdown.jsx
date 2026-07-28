import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getSavedRooms,
  getUnreadRoomCount,
  MESSAGE_CHANGE_EVENT,
  MESSAGE_OPEN_EVENT,
  MESSAGE_STORAGE_KEY,
} from "./messageStorage";
import "../../css/message/messageDropdown.css";

const MessageDropdownPanel = lazy(() =>
  import("./MessageDropdownPanel")
);

function MessageDropdown() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(() =>
      getUnreadRoomCount(getSavedRooms())
    );

  const [openRoomId, setOpenRoomId] =
    useState(null);

  const messageRef = useRef(null);

  const refreshUnreadCount =
    useCallback(() => {
      setUnreadCount(
        getUnreadRoomCount(getSavedRooms())
      );
    }, []);

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const nextOpen = !prev;

      if (!nextOpen) {
        setOpenRoomId(null);
      }

      return nextOpen;
    });
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setOpenRoomId(null);
  }, []);

  useEffect(() => {
    const handleMessageChange = () => {
      refreshUnreadCount();
    };

    const handleStorageChange = (event) => {
      if (
        event.key &&
        event.key !== MESSAGE_STORAGE_KEY
      ) {
        return;
      }

      refreshUnreadCount();
    };

    const handleOpenMessage = (event) => {
      setOpenRoomId(
        event.detail?.roomId ?? null
      );

      setIsOpen(true);
      refreshUnreadCount();
    };

    window.addEventListener(
      MESSAGE_CHANGE_EVENT,
      handleMessageChange
    );

    window.addEventListener(
      MESSAGE_OPEN_EVENT,
      handleOpenMessage
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        MESSAGE_CHANGE_EVENT,
        handleMessageChange
      );

      window.removeEventListener(
        MESSAGE_OPEN_EVENT,
        handleOpenMessage
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        messageRef.current &&
        !messageRef.current.contains(
          event.target
        )
      ) {
        handleClose();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [handleClose, isOpen]);

  return (
    <div
      className="message-dropdown-wrap"
      ref={messageRef}
    >
      <button
        type="button"
        className="message-icon-btn"
        onClick={handleToggleOpen}
        aria-label="메세지"
        aria-expanded={isOpen}
      >
        <span className="message-icon">
          💬
        </span>

        {unreadCount > 0 && (
          <span className="message-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Suspense
          fallback={
            <div className="message-dropdown-box">
              <div className="message-empty-box">
                <p>
                  메세지를 불러오는 중입니다.
                </p>
              </div>
            </div>
          }
        >
          <MessageDropdownPanel
            key={String(
              openRoomId ?? "room-list"
            )}
            initialRoomId={openRoomId}
            onClose={handleClose}
            onRoomsChange={
              refreshUnreadCount
            }
          />
        </Suspense>
      )}
    </div>
  );
}

export default MessageDropdown;