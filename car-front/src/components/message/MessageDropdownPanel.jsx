import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getChatRoomMessages,
  getMyChatRooms,
  sendChatMessage,
} from "../../api/chatApi";
import {
  useAuth,
} from "../../hooks/useAuth";

const emojiList = [
  "😀", "😂", "😊", "😍", "👍",
  "🙏", "🔥", "🚗", "💬", "❤️",
];

function formatMessageTime(dateText) {
  if (!dateText) {
    return "";
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameMinute(dateA, dateB) {
  const first = new Date(dateA);
  const second = new Date(dateB);

  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(second.getTime())
  ) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate() &&
    first.getHours() === second.getHours() &&
    first.getMinutes() === second.getMinutes()
  );
}

function shouldShowTime(messages, index) {
  const current = messages[index];
  const next = messages[index + 1];

  if (!next) {
    return true;
  }

  return !(
    current.senderType === next.senderType &&
    isSameMinute(current.createdAt, next.createdAt)
  );
}

function MessageDropdownPanel({
  initialRoomId,
  onClose,
  onRoomsChange,
}) {
  const { loginUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRoomId ?? null
  );
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const chatEndRef = useRef(null);

  const selectedRoom = rooms.find(
    (room) => String(room.roomId) === String(selectedRoomId)
  ) || null;

  const loadRooms = useCallback(async () => {
    try {
      const roomList = await getMyChatRooms();
      const nextRooms = Array.isArray(roomList) ? roomList : [];
      setRooms(nextRooms);
      onRoomsChange?.();

      if (
        selectedRoomId !== null &&
        !nextRooms.some(
          (room) => String(room.roomId) === String(selectedRoomId)
        )
      ) {
        setSelectedRoomId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("채팅방 목록 조회 실패:", error);
      setErrorMessage(
        error?.message || "채팅방 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [onRoomsChange, selectedRoomId]);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    try {
      const messageList = await getChatRoomMessages(roomId);
      setMessages(Array.isArray(messageList) ? messageList : []);
      setErrorMessage("");
    } catch (error) {
      console.error("채팅 메시지 조회 실패:", error);
      setErrorMessage(
        error?.message || "대화 내용을 불러오지 못했습니다."
      );
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ block: "end" });
    });
  }, []);

  const handleRoomClick = (roomId) => {
    setSelectedRoomId(roomId);
    setInputMessage("");
    setIsEmojiOpen(false);
  };

  const handleBackToList = () => {
    setSelectedRoomId(null);
    setMessages([]);
    setInputMessage("");
    setIsEmojiOpen(false);
    loadRooms();
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = inputMessage.trim();
    if (!text || !selectedRoomId || isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const savedMessage = await sendChatMessage(
        selectedRoomId,
        text
      );
      setMessages((prev) => [...prev, savedMessage]);
      setInputMessage("");
      setIsEmojiOpen(false);
      await loadRooms();
    } catch (error) {
      console.error("채팅 메시지 전송 실패:", error);
      setErrorMessage(
        error?.message || "메시지를 전송하지 못했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const loadId = window.setTimeout(loadRooms, 0);
    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadRooms]);

  useEffect(() => {
    if (!selectedRoomId) {
      return undefined;
    }

    const initialLoadId = window.setTimeout(
      () => loadMessages(selectedRoomId),
      0
    );

    const intervalId = window.setInterval(() => {
      loadMessages(selectedRoomId);
    }, 3000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadMessages, selectedRoomId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const myRole = loginUser?.role;

  return (
    <div className="message-dropdown-box">
      {!selectedRoom ? (
        <div className="message-room-list-view">
          <div className="message-dropdown-header">
            <strong>메시지</strong>
            <span>{rooms.length}개</span>
          </div>

          {isLoading ? (
            <div className="message-empty-box">
              <p>메시지를 불러오는 중입니다.</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="message-empty-box">
              <p>아직 생성된 채팅방이 없습니다.</p>
              <span>
                차량 상세 페이지에서 판매자 문의를 누르면 생성됩니다.
              </span>
            </div>
          ) : (
            <div className="message-room-list">
              {rooms.map((room) => {
                const partnerName =
                  myRole === "DEALER"
                    ? room.memberName
                    : room.dealerName;

                return (
                  <button
                    key={room.roomId}
                    type="button"
                    className="message-room-item"
                    onClick={() => handleRoomClick(room.roomId)}
                  >
                    <div className="message-room-profile">
                      {partnerName?.slice(0, 1) || "상"}
                    </div>
                    <div className="message-room-info">
                      <div className="message-room-top">
                        <strong>{partnerName}</strong>
                        <span>
                          {formatMessageTime(
                            room.lastMessageTime || room.createdAt
                          )}
                        </span>
                      </div>
                      <p>{room.carName}</p>
                      <small>
                        {room.lastMessage || "대화를 시작해 보세요."}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {errorMessage && (
            <div className="message-empty-box">
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="message-chat-view">
          <div className="message-chat-header">
            <button
              type="button"
              className="message-back-btn"
              onClick={handleBackToList}
            >
              ←
            </button>
            <div>
              <strong>
                {myRole === "DEALER"
                  ? selectedRoom.memberName
                  : selectedRoom.dealerName}
              </strong>
              <span>1:1 차량 문의</span>
            </div>
          </div>

          <div className="message-car-info-box">
            <span>문의 차량</span>
            <strong>{selectedRoom.carName}</strong>
          </div>

          <div className="message-chat-body">
            {messages.map((message, index) => {
              const isMine = message.senderType === myRole;
              const showTime = shouldShowTime(messages, index);

              return (
                <div
                  key={message.messageId}
                  className={`message-chat-row ${isMine ? "me" : "seller"}`}
                >
                  <div className="message-chat-bubble">
                    <p>{message.message}</p>
                    {showTime && (
                      <span>{formatMessageTime(message.createdAt)}</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {errorMessage && (
            <div className="message-empty-box">
              <p>{errorMessage}</p>
            </div>
          )}

          <form className="message-input-area" onSubmit={handleSendMessage}>
            <div className="message-extra-area">
              {isEmojiOpen && (
                <div className="message-emoji-box">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setInputMessage((prev) => prev + emoji)
                      }
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="message-sub-btn"
                onClick={() => setIsEmojiOpen((prev) => !prev)}
                aria-label="이모지 선택"
              >
                ☺
              </button>
            </div>

            <input
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder="메시지 입력"
              maxLength={1000}
            />

            <button
              type="submit"
              className="message-send-btn"
              disabled={!inputMessage.trim() || isSending}
            >
              {isSending ? "전송 중" : "전송"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default MessageDropdownPanel;
