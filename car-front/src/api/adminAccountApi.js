import apiClient from "./apiClient";

const ACCOUNT_API_PATH_MAP = {
    member: "/admin/members",
    company: "/admin/companies",
    dealer: "/admin/dealers",
};

function getAccountApiPath(accountType) {
    const path =
        ACCOUNT_API_PATH_MAP[accountType];

    if (!path) {
        throw new Error(
            "올바르지 않은 관리자 계정 유형입니다."
        );
    }

    return path;
}

function normalizePageResponse(result) {
    if (Array.isArray(result)) {
        return {
            content: result,
            totalElements: result.length,
            totalPages: 1,
            number: 0,
            size: result.length,
        };
    }

    return {
        content: Array.isArray(result?.content)
            ? result.content
            : [],

        totalElements: Number(
            result?.totalElements || 0
        ),

        totalPages: Number(
            result?.totalPages || 0
        ),

        number: Number(result?.number || 0),

        size: Number(result?.size || 10),
    };
}

export async function getAdminAccounts({
    accountType,
    query = "",
    status = "",
    page = 0,
    size = 100,
}) {
    const path =
        getAccountApiPath(accountType);

    const params = {
        page,
        size,
    };

    const normalizedQuery =
        String(query || "").trim();

    const normalizedStatus =
        String(status || "").trim();

    if (normalizedQuery) {
        params.query = normalizedQuery;
    }

    if (
        normalizedStatus &&
        normalizedStatus !== "ALL"
    ) {
        params.status = normalizedStatus;
    }

    const result = await apiClient.get(
        path,
        {
            params,
        }
    );

    return normalizePageResponse(result);
}

export async function updateAdminAccountStatus({
    accountType,
    accountId,
    status,
}) {
    if (!accountId) {
        throw new Error(
            "변경할 계정 ID를 확인할 수 없습니다."
        );
    }

    const path =
        getAccountApiPath(accountType);

    const normalizedStatus = String(
        status || ""
    )
        .trim()
        .toUpperCase();

    const allowedStatuses = [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
        "WITHDRAWN",
    ];

    if (
        !allowedStatuses.includes(
            normalizedStatus
        )
    ) {
        throw new Error(
            "올바르지 않은 계정 상태입니다."
        );
    }

    return apiClient.patch(
        `${path}/${accountId}/status`,
        {
            status: normalizedStatus,
        }
    );
}