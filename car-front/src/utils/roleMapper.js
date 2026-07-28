import {
    AUTH_ROLES,
} from "../data/authUser";

export const SERVER_AUTH_ROLES = {
    ADMIN: "ADMIN",
    COMPANY_MASTER: "COMPANY_MASTER",
    DEALER: "DEALER",
    MEMBER: "MEMBER",
};

export function mapServerRoleToClientRole(
    serverRole
) {
    const normalizedRole = String(
        serverRole || ""
    ).toUpperCase();

    if (
        normalizedRole ===
        SERVER_AUTH_ROLES.COMPANY_MASTER
    ) {
        return AUTH_ROLES.COMPANY;
    }

    if (
        Object.values(AUTH_ROLES).includes(
            normalizedRole
        )
    ) {
        return normalizedRole;
    }

    return "";
}

export function mapClientRoleToServerRole(
    clientRole
) {
    if (
        clientRole === AUTH_ROLES.COMPANY
    ) {
        return SERVER_AUTH_ROLES.COMPANY_MASTER;
    }

    if (
        Object.values(
            SERVER_AUTH_ROLES
        ).includes(clientRole)
    ) {
        return clientRole;
    }

    return "";
}