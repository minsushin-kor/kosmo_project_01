import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getSavedRooms,
  MESSAGE_CHANGE_EVENT,
  MESSAGE_EVENT_SOURCE,
  MESSAGE_STORAGE_KEY,
  saveMessageRooms,
} from "./messageStorage";

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

  return !(
    currentMessage.sender ===
    nextMessage.sender &&
    isSameMinute(
      currentMessage.createdAt,
      nextMessage.createdAt
    )
  );
}

function MessageDropdownPanel({
  initialRoomId,
  onClose,
  onRoomsChange,
}) {
  const [initialState] = useState(() => {
    const savedRooms = getSavedRooms();

    if (
      initialRoomId === null ||
      initialRoomId === undefined
    ) {
      return {
        rooms: savedRooms,
        selectedRoomIndex: null,
        shouldSaveReadState: false,
      };
    }

    const targetIndex =
      savedRooms.findIndex(
        (room) =>
          String(room.roomId) ===
          String(initialRoomId)
      );

    if (targetIndex === -1) {
      return {
        rooms: savedRooms,
        selectedRoomIndex: null,
        shouldSaveReadState: false,
      };
    }

    const shouldSaveReadState =
      savedRooms[targetIndex]?.isRead ===
      false;

    const nextRooms =
      shouldSaveReadState
        ? savedRooms.map(
          (room, index) =>
            index === targetIndex
              ? {
                ...room,
                isRead: true,
              }
              : room
        )
        : savedRooms;

    return {
      rooms: nextRooms,
      selectedRoomIndex: targetIndex,
      shouldSaveReadState,
    };
  });

  const [rooms, setRooms] =
    useState(initialState.rooms);

  const [
    selectedRoomIndex,
    setSelectedRoomIndex,
  ] = useState(
    initialState.selectedRoomIndex
  );

  const [
    inputMessage,
    setInputMessage,
  ] = useState("");

  const [
    isEmojiOpen,
    setIsEmojiOpen,
  ] = useState(false);

  const chatEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const selectedRoom =
    selectedRoomIndex !== null
      ? rooms[selectedRoomIndex] ||
      null
      : null;

  const loadRooms =
    useCallback(() => {
      setRooms(getSavedRooms());
    }, []);

  const saveRooms =
    useCallback(
      (nextRooms) => {
        saveMessageRooms(
          nextRooms,
          MESSAGE_EVENT_SOURCE
        );

        setRooms(nextRooms);
        onRoomsChange?.();
      },
      [onRoomsChange]
    );

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

  useEffect(() => {
    if (
      !initialState
        .shouldSaveReadState
    ) {
      return;
    }

    saveMessageRooms(
      initialState.rooms,
      MESSAGE_EVENT_SOURCE
    );

    onRoomsChange?.();
  }, [
    initialState,
    onRoomsChange,
  ]);

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

    window.addEventListener(
      MESSAGE_CHANGE_EVENT,
      handleMessageChange
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
        "storage",
        handleStorageChange
      );
    };
  }, [loadRooms]);

  useEffect(() => {
    if (!selectedRoom) {
      return;
    }

    scrollToBottom();
  }, [
    scrollToBottom,
    selectedRoom,
  ]);

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  return (
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
                    className={`message-room-item ${room.isRead ===
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
                        {room.carName}
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
                    className={`message-chat-row ${message.sender ===
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
                        key={emoji}
                        type="button"
                        onClick={() =>
                          setInputMessage(
                            (prev) =>
                              prev +
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
                onClick={() =>
                  imageInputRef
                    .current
                    ?.click()
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
                  event.target.value
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
  );
}

export default MessageDropdownPanel;