import apiClient from "./apiClient";

export async function updateMemberProfile(
    requestData
) {
    return apiClient.put(
        "/users/me/member-profile",
        requestData
    );
}