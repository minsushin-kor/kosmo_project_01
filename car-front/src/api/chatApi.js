import apiClient from "./apiClient";

export function createOrGetChatRoom(carId) {
  return apiClient.post("/chat/rooms", {
    carId: Number(carId),
  });
}

export function getMyChatRooms() {
  return apiClient.get("/chat/rooms");
}

export function getChatRoomMessages(roomId) {
  return apiClient.get(
    `/chat/rooms/${roomId}/messages`
  );
}

export function sendChatMessage(
  roomId,
  message
) {
  return apiClient.post(
    `/chat/rooms/${roomId}/messages`,
    { message }
  );
}

export function markChatRoomAsRead(roomId) {
  return apiClient.post(`/chat/rooms/${roomId}/read`);
}