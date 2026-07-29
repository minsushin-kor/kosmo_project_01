import apiClient from "./apiClient";

export async function getMyTransactions() {
    const result =
        await apiClient.get(
            "/users/me/transactions"
        );

    return Array.isArray(result)
        ? result
        : [];
}

export async function getTransactionDetail(
    transactionId
) {
    if (!transactionId) {
        throw new Error(
            "거래 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.get(
        `/transactions/${transactionId}`
    );
}

export async function updateTransactionStatus(
    transactionId,
    status
) {
    if (!transactionId) {
        throw new Error(
            "거래 ID를 확인할 수 없습니다."
        );
    }

    const normalizedStatus =
        String(status || "")
            .trim()
            .toUpperCase();

    const allowedStatuses = [
        "PENDING_PAYMENT",
        "PAID",
        "COMPLETED",
        "CANCELLED",
    ];

    if (
        !allowedStatuses.includes(
            normalizedStatus
        )
    ) {
        throw new Error(
            "올바르지 않은 거래 상태입니다."
        );
    }

    return apiClient.patch(
        `/transactions/${transactionId}/status`,
        {
            status:
                normalizedStatus,
        }
    );
}