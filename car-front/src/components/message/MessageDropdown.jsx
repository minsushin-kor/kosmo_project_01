import { useEffect, useRef, useState } from "react";
import "../../css/message/messageDropdown.css";

const emojiList = ["😀", "😂", "😊", "😍", "👍", "🙏", "🔥", "🚗", "💬", "❤️"];

function MessageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const messageRef = useRef(null);
  const chatEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const getSavedRooms = () => {
    return JSON.parse(localStorage.getItem("car_front_messages") || "[]");
  };

  const saveRooms = (nextRooms) => {
    localStorage.setItem("car_front_messages", JSON.stringify(nextRooms));
    setRooms(nextRooms);
    window.dispatchEvent(new Event("message-change"));
  };

  const loadRooms = () => {
    const savedRooms = getSavedRooms();
    setRooms(savedRooms);
  };

  const selectedRoom =
    selectedRoomIndex !== null ? rooms[selectedRoomIndex] : null;

  const unreadCount = rooms.filter((room) => room.isRead === false).length;

  const formatMessageTime = (dateText) => {
    if (!dateText) return "";

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSameMinute = (dateA, dateB) => {
    const first = new Date(dateA);
    const second = new Date(dateB);

    if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
      return false;
    }

    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate() &&
      first.getHours() === second.getHours() &&
      first.getMinutes() === second.getMinutes()
    );
  };

  const shouldShowTime = (messages, index) => {
    const currentMessage = messages[index];
    const nextMessage = messages[index + 1];

    if (!nextMessage) return true;

    const isSameSender = currentMessage.sender === nextMessage.sender;
    const isCloseTime = isSameMinute(
      currentMessage.createdAt,
      nextMessage.createdAt
    );

    return !(isSameSender && isCloseTime);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({
          block: "end",
        });
      });
    });
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleRoomClick = (roomIndex) => {
    const nextRooms = rooms.map((room, index) =>
      index === roomIndex ? { ...room, isRead: true } : room
    );

    saveRooms(nextRooms);
    setSelectedRoomIndex(roomIndex);
    setIsEmojiOpen(false);
    scrollToBottom();
  };

  const handleBackToList = () => {
    setSelectedRoomIndex(null);
    setInputMessage("");
    setIsEmojiOpen(false);
  };

  const addMessageToRoom = (newMessage, lastMessageText) => {
    if (selectedRoomIndex === null) return;

    const nextRooms = rooms.map((room, index) => {
      if (index !== selectedRoomIndex) return room;

      return {
        ...room,
        lastMessage: lastMessageText,
        updatedAt: newMessage.createdAt,
        isRead: true,
        messages: [...(room.messages || []), newMessage],
      };
    });

    saveRooms(nextRooms);
    scrollToBottom();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    const text = inputMessage.trim();

    if (!text || !selectedRoom) return;

    const newMessage = {
      id: Date.now(),
      sender: "ME",
      type: "TEXT",
      text,
      createdAt: new Date().toISOString(),
    };

    addMessageToRoom(newMessage, text);
    setInputMessage("");
    setIsEmojiOpen(false);
  };

  const handleEmojiClick = (emoji) => {
    setInputMessage((prev) => prev + emoji);
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file || !selectedRoom) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 전송할 수 있습니다.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const newMessage = {
        id: Date.now(),
        sender: "ME",
        type: "IMAGE",
        text: "",
        imageUrl: reader.result,
        fileName: file.name,
        createdAt: new Date().toISOString(),
      };

      addMessageToRoom(newMessage, "사진을 보냈습니다.");
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadRooms();

    const handleMessageChange = () => {
      loadRooms();
    };

    const handleOpenMessage = (e) => {
      const roomId = e.detail?.roomId;

      const savedRooms = getSavedRooms();

      setRooms(savedRooms);
      setIsOpen(true);

      if (roomId) {
        const targetIndex = savedRooms.findIndex(
          (room) => room.roomId === roomId
        );

        if (targetIndex !== -1) {
          const nextRooms = savedRooms.map((room, index) =>
            index === targetIndex ? { ...room, isRead: true } : room
          );

          saveRooms(nextRooms);
          setSelectedRoomIndex(targetIndex);
          scrollToBottom();
        }
      }
    };

    window.addEventListener("message-change", handleMessageChange);
    window.addEventListener("message-open", handleOpenMessage);
    window.addEventListener("storage", handleMessageChange);

    return () => {
      window.removeEventListener("message-change", handleMessageChange);
      window.removeEventListener("message-open", handleOpenMessage);
      window.removeEventListener("storage", handleMessageChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messageRef.current && !messageRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectedRoomIndex(null);
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || selectedRoomIndex === null || !selectedRoom) return;

    scrollToBottom();
  }, [isOpen, selectedRoomIndex, selectedRoom?.messages?.length]);

  return (
    <div className="message-dropdown-wrap" ref={messageRef}>
      <button
        type="button"
        className="message-icon-btn"
        onClick={handleToggleOpen}
        aria-label="메세지"
      >
        <span className="message-icon">💬</span>

        {unreadCount > 0 && (
          <span className="message-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="message-dropdown-box">
          {!selectedRoom ? (
            <div className="message-room-list-view">
              <div className="message-dropdown-header">
                <strong>메세지</strong>
                <span>{rooms.length}개</span>
              </div>

              {rooms.length === 0 ? (
                <div className="message-empty-box">
                  <p>아직 받은 메세지가 없습니다.</p>
                  <span>
                    차량 상세 페이지에서 판매자에게 문의를 누르면 생성됩니다.
                  </span>
                </div>
              ) : (
                <div className="message-room-list">
                  {rooms.map((room, index) => (
                    <button
                      key={`${room.roomId || "room"}-${index}`}
                      type="button"
                      className={`message-room-item ${
                        room.isRead === false ? "unread" : ""
                      }`}
                      onClick={() => handleRoomClick(index)}
                    >
                      <div className="message-room-profile">
                        {room.sellerName?.slice(0, 1) || "판"}
                      </div>

                      <div className="message-room-info">
                        <div className="message-room-top">
                          <strong>{room.sellerName}</strong>
                          <span>{formatMessageTime(room.updatedAt)}</span>
                        </div>

                        <p>{room.carName}</p>
                        <small>{room.lastMessage}</small>
                      </div>

                      {room.isRead === false && (
                        <span className="message-room-dot" />
                      )}
                    </button>
                  ))}
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
                  <strong>{selectedRoom.sellerName}</strong>
                  <span>{selectedRoom.companyName}</span>
                </div>
              </div>

              <div className="message-car-info-box">
                <span>문의 차량</span>
                <strong>{selectedRoom.carName}</strong>
              </div>

              <div className="message-chat-body">
                {(selectedRoom.messages || []).map((message, index) => {
                  const messages = selectedRoom.messages || [];
                  const showTime = shouldShowTime(messages, index);

                  return (
                    <div
                      key={`${message.id}-${index}`}
                      className={`message-chat-row ${
                        message.sender === "ME" ? "me" : "seller"
                      }`}
                    >
                      <div className="message-chat-bubble">
                        {message.type === "IMAGE" ? (
                          <img
                            src={message.imageUrl}
                            alt={message.fileName || "전송 이미지"}
                            className="message-chat-image"
                          />
                        ) : (
                          <p>{message.text}</p>
                        )}

                        {showTime && (
                          <span>{formatMessageTime(message.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={chatEndRef} />
              </div>

              <form className="message-input-area" onSubmit={handleSendMessage}>
                <div className="message-extra-area">
                  {isEmojiOpen && (
                    <div className="message-emoji-box">
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="message-sub-btn"
                    onClick={handleImageButtonClick}
                  >
                    ＋
                  </button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="message-image-input"
                    onChange={handleImageChange}
                  />

                  <button
                    type="button"
                    className="message-sub-btn"
                    onClick={() => setIsEmojiOpen((prev) => !prev)}
                  >
                    ☺
                  </button>
                </div>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="메세지 입력"
                />

                <button type="submit" className="message-send-btn">
                  전송
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageDropdown;