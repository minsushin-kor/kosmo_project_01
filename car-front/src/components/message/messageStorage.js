export const MESSAGE_OPEN_EVENT =
  "message-open";

export const MESSAGE_REFRESH_EVENT =
  "message-refresh";

export function openMessageRoom(roomId) {
  window.dispatchEvent(
    new CustomEvent(MESSAGE_OPEN_EVENT, {
      detail: { roomId },
    })
  );
}

export function refreshMessageRooms() {
  window.dispatchEvent(
    new CustomEvent(MESSAGE_REFRESH_EVENT)
  );
}
