import apiClient from "./apiClient";
import {
    mapClientRoleToServerRole,
    mapServerRoleToClientRole,
} from "../utils/roleMapper";

export async function login({
    loginId,
    password,
    role,
}) {
    const roleType =
        mapClientRoleToServerRole(role);

    if (!roleType) {
        throw new Error(
            "올바르지 않은 계정 유형입니다."
        );
    }

    const response =
        await apiClient.post(
            "/auth/login",
            {
                loginId,
                password,
                roleType,
            }
        );

    return {
        token: response.token,

        role:
            mapServerRoleToClientRole(
                response.role
            ),

        serverRole:
            response.role,

        name:
            response.name,

        loginId:
            response.loginId,
    };
}

export async function signupMember(
    requestData
) {
    return apiClient.post(
        "/auth/signup/member",
        requestData
    );
}

export async function signupCompany(
    requestData
) {
    return apiClient.post(
        "/auth/signup/company",
        requestData
    );
}

export async function getMyProfile() {
    return apiClient.get(
        "/users/me/profile"
    );
}