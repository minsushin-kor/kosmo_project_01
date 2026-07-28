export const MESSAGE_STORAGE_KEY =
  "car_front_messages";

export const MESSAGE_CHANGE_EVENT =
  "message-change";

export const MESSAGE_OPEN_EVENT =
  "message-open";

export const MESSAGE_EVENT_SOURCE =
  "message-dropdown-panel";

export function getSavedRooms() {
  try {
    const savedValue = localStorage.getItem(
      MESSAGE_STORAGE_KEY
    );

    if (!savedValue) {
      return [];
    }

    const parsedRooms = JSON.parse(savedValue);

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

export function saveMessageRooms(
  nextRooms,
  source = MESSAGE_EVENT_SOURCE
) {
  localStorage.setItem(
    MESSAGE_STORAGE_KEY,
    JSON.stringify(nextRooms)
  );

  window.dispatchEvent(
    new CustomEvent(MESSAGE_CHANGE_EVENT, {
      detail: {
        source,
      },
    })
  );
}

export function getUnreadRoomCount(rooms) {
  return rooms.filter(
    (room) => room.isRead === false
  ).length;
}