import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "../../css/message/messageDropdown.css";

const MESSAGE_STORAGE_KEY =
  "car_front_messages";

const MESSAGE_CHANGE_EVENT =
  "message-change";

const MESSAGE_OPEN_EVENT =
  "message-open";

const MESSAGE_EVENT_SOURCE =
  "message-dropdown";

const emojiList = [
  "😀",
  "😂",
  "😊",
  "😍",
  "👍",
  "🙏",
  "🔥",
  "🚗",
  "💬",
  "❤️",
];

function getSavedRooms() {
  try {
    const savedValue =
      localStorage.getItem(
        MESSAGE_STORAGE_KEY
      );

    if (!savedValue) {
      return [];
    }

    const parsedRooms =
      JSON.parse(savedValue);

    return Array.isArray(parsedRooms)
      ? parsedRooms
      : [];
  } catch (error) {
    console.error(
      "메세지 목록 불러오기 실패:",
      error
    );

    localStorage.removeItem(
      MESSAGE_STORAGE_KEY
    );

    return [];
  }
}

function formatMessageTime(dateText) {
  if (!dateText) {
    return "";
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "ko-KR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
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
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate() &&
    first.getHours() ===
      second.getHours() &&
    first.getMinutes() ===
      second.getMinutes()
  );
}

function shouldShowTime(
  messages,
  index
) {
  const currentMessage =
    messages[index];

  const nextMessage =
    messages[index + 1];

  if (!nextMessage) {
    return true;
  }

  const isSameSender =
    currentMessage.sender ===
    nextMessage.sender;

  const isCloseTime =
    isSameMinute(
      currentMessage.createdAt,
      nextMessage.createdAt
    );

  return !(
    isSameSender &&
    isCloseTime
  );
}

function MessageDropdown() {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  /*
   * 기존에는 빈 배열로 시작한 뒤
   * useEffect에서 loadRooms를 호출했습니다.
   *
   * 이제 처음 상태를 만들 때 localStorage를
   * 한 번만 읽으므로 추가 렌더링이 발생하지 않습니다.
   */
  const [
    rooms,
    setRooms,
  ] = useState(getSavedRooms);

  const [
    selectedRoomIndex,
    setSelectedRoomIndex,
  ] = useState(null);

  const [
    inputMessage,
    setInputMessage,
  ] = useState("");

  const [
    isEmojiOpen,
    setIsEmojiOpen,
  ] = useState(false);

  const messageRef =
    useRef(null);

  const chatEndRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const selectedRoom =
    selectedRoomIndex !== null
      ? rooms[selectedRoomIndex] ||
        null
      : null;

  const unreadCount =
    rooms.filter(
      (room) =>
        room.isRead === false
    ).length;

  const loadRooms =
    useCallback(() => {
      setRooms(getSavedRooms());
    }, []);

  const saveRooms =
    useCallback((nextRooms) => {
      localStorage.setItem(
        MESSAGE_STORAGE_KEY,
        JSON.stringify(nextRooms)
      );

      /*
       * 현재 컴포넌트 화면은 직접 갱신합니다.
       */
      setRooms(nextRooms);

      /*
       * 다른 컴포넌트가 메시지 변경을
       * 확인할 수 있도록 이벤트를 보냅니다.
       *
       * source를 넣어 현재 컴포넌트가
       * 자기 이벤트를 다시 처리하지 않게 합니다.
       */
      window.dispatchEvent(
        new CustomEvent(
          MESSAGE_CHANGE_EVENT,
          {
            detail: {
              source:
                MESSAGE_EVENT_SOURCE,
            },
          }
        )
      );
    }, []);

  const scrollToBottom =
    useCallback(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatEndRef.current
            ?.scrollIntoView({
              block: "end",
            });
        });
      });
    }, []);

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleRoomClick = (
    roomIndex
  ) => {
    const nextRooms =
      rooms.map(
        (room, index) =>
          index === roomIndex
            ? {
                ...room,
                isRead: true,
              }
            : room
      );

    saveRooms(nextRooms);

    setSelectedRoomIndex(
      roomIndex
    );

    setIsEmojiOpen(false);

    scrollToBottom();
  };

  const handleBackToList = () => {
    setSelectedRoomIndex(null);
    setInputMessage("");
    setIsEmojiOpen(false);
  };

  const addMessageToRoom =
    useCallback(
      (
        newMessage,
        lastMessageText
      ) => {
        if (
          selectedRoomIndex === null
        ) {
          return;
        }

        const nextRooms =
          rooms.map(
            (room, index) => {
              if (
                index !==
                selectedRoomIndex
              ) {
                return room;
              }

              return {
                ...room,
                lastMessage:
                  lastMessageText,
                updatedAt:
                  newMessage.createdAt,
                isRead: true,
                messages: [
                  ...(room.messages ||
                    []),
                  newMessage,
                ],
              };
            }
          );

        saveRooms(nextRooms);
        scrollToBottom();
      },
      [
        rooms,
        saveRooms,
        scrollToBottom,
        selectedRoomIndex,
      ]
    );

  const handleSendMessage = (
    event
  ) => {
    event.preventDefault();

    const text =
      inputMessage.trim();

    if (!text || !selectedRoom) {
      return;
    }

    const newMessage = {
      id: crypto.randomUUID(),
      sender: "ME",
      type: "TEXT",
      text,
      createdAt:
        new Date().toISOString(),
    };

    addMessageToRoom(
      newMessage,
      text
    );

    setInputMessage("");
    setIsEmojiOpen(false);
  };

  const handleEmojiClick = (
    emoji
  ) => {
    setInputMessage(
      (prev) => prev + emoji
    );
  };

  const handleImageButtonClick =
    () => {
      imageInputRef.current
        ?.click();
    };

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file || !selectedRoom) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "이미지 파일만 전송할 수 있습니다."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const newMessage = {
        id: crypto.randomUUID(),
        sender: "ME",
        type: "IMAGE",
        text: "",
        imageUrl:
          reader.result,
        fileName: file.name,
        createdAt:
          new Date().toISOString(),
      };

      addMessageToRoom(
        newMessage,
        "사진을 보냈습니다."
      );

      event.target.value = "";
    };

    reader.onerror = () => {
      alert(
        "이미지를 불러오지 못했습니다."
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  /*
   * 메시지 관련 외부 이벤트만 구독합니다.
   *
   * 초기 데이터는 useState(getSavedRooms)에서
   * 이미 불러왔으므로 여기서 loadRooms를
   * 즉시 호출하지 않습니다.
   */
  useEffect(() => {
    const handleMessageChange = (
      event
    ) => {
      if (
        event.detail?.source ===
        MESSAGE_EVENT_SOURCE
      ) {
        return;
      }

      loadRooms();
    };

    const handleStorageChange = (
      event
    ) => {
      if (
        event.key &&
        event.key !==
          MESSAGE_STORAGE_KEY
      ) {
        return;
      }

      loadRooms();
    };

    const handleOpenMessage = (
      event
    ) => {
      const roomId =
        event.detail?.roomId;

      const savedRooms =
        getSavedRooms();

      setRooms(savedRooms);
      setIsOpen(true);

      if (!roomId) {
        return;
      }

      const targetIndex =
        savedRooms.findIndex(
          (room) =>
            String(room.roomId) ===
            String(roomId)
        );

      if (targetIndex === -1) {
        return;
      }

      const nextRooms =
        savedRooms.map(
          (room, index) =>
            index === targetIndex
              ? {
                  ...room,
                  isRead: true,
                }
              : room
        );

      saveRooms(nextRooms);

      setSelectedRoomIndex(
        targetIndex
      );

      setIsEmojiOpen(false);

      scrollToBottom();
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
  }, [
    loadRooms,
    saveRooms,
    scrollToBottom,
  ]);

  /*
   * 드롭다운 바깥을 누르면 닫기
   */
  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        messageRef.current &&
        !messageRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
        setSelectedRoomIndex(null);
        setIsEmojiOpen(false);
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
  }, []);

  /*
   * 채팅방이 열리거나 메시지 수가
   * 변경됐을 때만 마지막 메시지로 이동
   */
  useEffect(() => {
    if (
      !isOpen ||
      selectedRoomIndex === null ||
      !selectedRoom
    ) {
      return;
    }

    scrollToBottom();
  }, [
    isOpen,
    scrollToBottom,
    selectedRoom,
    selectedRoomIndex,
  ]);

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
        <div className="message-dropdown-box">
          {!selectedRoom ? (
            <div className="message-room-list-view">
              <div className="message-dropdown-header">
                <strong>
                  메세지
                </strong>

                <span>
                  {rooms.length}개
                </span>
              </div>

              {rooms.length === 0 ? (
                <div className="message-empty-box">
                  <p>
                    아직 받은 메세지가
                    없습니다.
                  </p>

                  <span>
                    차량 상세 페이지에서
                    판매자에게 문의를 누르면
                    생성됩니다.
                  </span>
                </div>
              ) : (
                <div className="message-room-list">
                  {rooms.map(
                    (
                      room,
                      index
                    ) => (
                      <button
                        key={
                          room.roomId ||
                          `room-${index}`
                        }
                        type="button"
                        className={`message-room-item ${
                          room.isRead ===
                          false
                            ? "unread"
                            : ""
                        }`}
                        onClick={() =>
                          handleRoomClick(
                            index
                          )
                        }
                      >
                        <div className="message-room-profile">
                          {room.sellerName
                            ?.slice(
                              0,
                              1
                            ) ||
                            "판"}
                        </div>

                        <div className="message-room-info">
                          <div className="message-room-top">
                            <strong>
                              {
                                room.sellerName
                              }
                            </strong>

                            <span>
                              {formatMessageTime(
                                room.updatedAt
                              )}
                            </span>
                          </div>

                          <p>
                            {
                              room.carName
                            }
                          </p>

                          <small>
                            {
                              room.lastMessage
                            }
                          </small>
                        </div>

                        {room.isRead ===
                          false && (
                          <span className="message-room-dot" />
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="message-chat-view">
              <div className="message-chat-header">
                <button
                  type="button"
                  className="message-back-btn"
                  onClick={
                    handleBackToList
                  }
                >
                  ←
                </button>

                <div>
                  <strong>
                    {
                      selectedRoom.sellerName
                    }
                  </strong>

                  <span>
                    {
                      selectedRoom.companyName
                    }
                  </span>
                </div>
              </div>

              <div className="message-car-info-box">
                <span>
                  문의 차량
                </span>

                <strong>
                  {
                    selectedRoom.carName
                  }
                </strong>
              </div>

              <div className="message-chat-body">
                {(
                  selectedRoom.messages ||
                  []
                ).map(
                  (
                    message,
                    index
                  ) => {
                    const messages =
                      selectedRoom.messages ||
                      [];

                    const showTime =
                      shouldShowTime(
                        messages,
                        index
                      );

                    return (
                      <div
                        key={
                          message.id ||
                          `${message.createdAt}-${index}`
                        }
                        className={`message-chat-row ${
                          message.sender ===
                          "ME"
                            ? "me"
                            : "seller"
                        }`}
                      >
                        <div className="message-chat-bubble">
                          {message.type ===
                          "IMAGE" ? (
                            <img
                              src={
                                message.imageUrl
                              }
                              alt={
                                message.fileName ||
                                "전송 이미지"
                              }
                              className="message-chat-image"
                            />
                          ) : (
                            <p>
                              {
                                message.text
                              }
                            </p>
                          )}

                          {showTime && (
                            <span>
                              {formatMessageTime(
                                message.createdAt
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                <div
                  ref={chatEndRef}
                />
              </div>

              <form
                className="message-input-area"
                onSubmit={
                  handleSendMessage
                }
              >
                <div className="message-extra-area">
                  {isEmojiOpen && (
                    <div className="message-emoji-box">
                      {emojiList.map(
                        (emoji) => (
                          <button
                            key={
                              emoji
                            }
                            type="button"
                            onClick={() =>
                              handleEmojiClick(
                                emoji
                              )
                            }
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="message-sub-btn"
                    onClick={
                      handleImageButtonClick
                    }
                    aria-label="이미지 전송"
                  >
                    ＋
                  </button>

                  <input
                    ref={
                      imageInputRef
                    }
                    type="file"
                    accept="image/*"
                    className="message-image-input"
                    onChange={
                      handleImageChange
                    }
                  />

                  <button
                    type="button"
                    className="message-sub-btn"
                    onClick={() =>
                      setIsEmojiOpen(
                        (prev) =>
                          !prev
                      )
                    }
                    aria-label="이모지 선택"
                  >
                    ☺
                  </button>
                </div>

                <input
                  type="text"
                  value={
                    inputMessage
                  }
                  onChange={(event) =>
                    setInputMessage(
                      event.target
                        .value
                    )
                  }
                  placeholder="메세지 입력"
                />

                <button
                  type="submit"
                  className="message-send-btn"
                  disabled={
                    !inputMessage.trim()
                  }
                >
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