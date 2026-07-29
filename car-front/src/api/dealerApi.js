import apiClient from "./apiClient";

export function getCompanyDealers() {
    return apiClient.get(
        "/company/dealers"
    );
}

export function createCompanyDealer(
    dealerData
) {
    return apiClient.post(
        "/company/dealers",
        dealerData
    );
}

export function getCompanyDealer(
    dealerId
) {
    if (!dealerId) {
        throw new Error(
            "딜러 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.get(
        `/company/dealers/${dealerId}`
    );
}

export function updateCompanyDealer(
    dealerId,
    dealerData
) {
    if (!dealerId) {
        throw new Error(
            "딜러 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.put(
        `/company/dealers/${dealerId}`,
        dealerData
    );
}

export function withdrawCompanyDealer(
    dealerId
) {
    if (!dealerId) {
        throw new Error(
            "딜러 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.delete(
        `/company/dealers/${dealerId}`
    );
}
export function getPublicDealer(
    dealerId
) {
    if (!dealerId) {
        throw new Error(
            "딜러 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.get(
        `/dealers/${dealerId}`
    );
}