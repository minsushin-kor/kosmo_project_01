import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getMyChatRooms,
} from "../../api/chatApi";
import {
  MESSAGE_OPEN_EVENT,
  MESSAGE_REFRESH_EVENT,
} from "./messageStorage";
import "../../css/message/messageDropdown.css";

const MessageDropdownPanel = lazy(() =>
  import("./MessageDropdownPanel")
);

function MessageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openRoomId, setOpenRoomId] = useState(null);
  const messageRef = useRef(null);

  const updateUnreadCount = useCallback((rooms) => {
    const totalUnread = Array.isArray(rooms)
      ? rooms.reduce(
          (sum, room) => sum + Number(room.unreadCount || 0),
          0
        )
      : 0;
    setUnreadCount(totalUnread);
  }, []);

  const refreshRoomCount = useCallback(async () => {
    try {
      const rooms = await getMyChatRooms();
      updateUnreadCount(rooms);
    } catch (error) {
      console.error("메시지 개수 조회 실패:", error);
    }
  }, [updateUnreadCount]);

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
    const initialLoadId = window.setTimeout(
      refreshRoomCount,
      0
    );

    const handleOpenMessage = (event) => {
      setOpenRoomId(event.detail?.roomId ?? null);
      setIsOpen(true);
      refreshRoomCount();
    };

    window.addEventListener(
      MESSAGE_OPEN_EVENT,
      handleOpenMessage
    );
    window.addEventListener(
      MESSAGE_REFRESH_EVENT,
      refreshRoomCount
    );

    return () => {
      window.clearTimeout(initialLoadId);
      window.removeEventListener(
        MESSAGE_OPEN_EVENT,
        handleOpenMessage
      );
      window.removeEventListener(
        MESSAGE_REFRESH_EVENT,
        refreshRoomCount
      );
    };
  }, [refreshRoomCount]);

  useEffect(() => {
    const intervalId = window.setInterval(
      refreshRoomCount,
      10000
    );
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshRoomCount]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        messageRef.current &&
        !messageRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose, isOpen]);

  return (
    <div className="message-dropdown-wrap" ref={messageRef}>
      <button
        type="button"
        className="message-icon-btn"
        onClick={handleToggleOpen}
        aria-label="메시지"
        aria-expanded={isOpen}
      >
        <span className="message-icon">💬</span>
        {unreadCount > 0 && (
          <span className="message-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Suspense
          fallback={
            <div className="message-dropdown-box">
              <div className="message-empty-box">
                <p>메시지를 불러오는 중입니다.</p>
              </div>
            </div>
          }
        >
          <MessageDropdownPanel
            key={String(openRoomId ?? "room-list")}
            initialRoomId={openRoomId}
            onClose={handleClose}
            onRoomsChange={updateUnreadCount}
          />
        </Suspense>
      )}
    </div>
  );
}

export default MessageDropdown;
