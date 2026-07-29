import {
    AUTH_ROLES,
} from "../data/authUser";

export const SERVER_AUTH_ROLES = {
    ADMIN: "ADMIN",
    COMPANY_MASTER: "COMPANY_MASTER",
    DEALER: "DEALER",
    MEMBER: "MEMBER",
};

function normalizeServerRole(serverRole) {
    return String(serverRole || "")
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, "");
}

export function mapServerRoleToClientRole(
    serverRole
) {
    const normalizedRole =
        normalizeServerRole(serverRole);

    if (
        normalizedRole ===
        SERVER_AUTH_ROLES.COMPANY_MASTER
    ) {
        return AUTH_ROLES.COMPANY;
    }

    if (
        normalizedRole ===
        SERVER_AUTH_ROLES.ADMIN
    ) {
        return AUTH_ROLES.ADMIN;
    }

    if (
        normalizedRole ===
        SERVER_AUTH_ROLES.DEALER
    ) {
        return AUTH_ROLES.DEALER;
    }

    if (
        normalizedRole ===
        SERVER_AUTH_ROLES.MEMBER
    ) {
        return AUTH_ROLES.MEMBER;
    }

    return "";
}

export function mapClientRoleToServerRole(
    clientRole
) {
    const normalizedRole = String(
        clientRole || ""
    )
        .trim()
        .toUpperCase();

    if (
        normalizedRole ===
        AUTH_ROLES.COMPANY
    ) {
        return SERVER_AUTH_ROLES.COMPANY_MASTER;
    }

    if (
        normalizedRole ===
        AUTH_ROLES.ADMIN
    ) {
        return SERVER_AUTH_ROLES.ADMIN;
    }

    if (
        normalizedRole ===
        AUTH_ROLES.DEALER
    ) {
        return SERVER_AUTH_ROLES.DEALER;
    }

    if (
        normalizedRole ===
        AUTH_ROLES.MEMBER
    ) {
        return SERVER_AUTH_ROLES.MEMBER;
    }

    return "";
}