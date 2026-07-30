import apiClient from "./apiClient";

export async function getPublicCompany(
    companyId
) {
    if (!companyId) {
        throw new Error(
            "회사 번호가 없습니다."
        );
    }

    return apiClient.get(
        `/companies/${companyId}`
    );
}

export async function getPublicCompanyDealers(
    companyId
) {
    if (!companyId) {
        return [];
    }

    const dealers =
        await apiClient.get(
            `/companies/${companyId}/dealers`
        );

    return Array.isArray(dealers)
        ? dealers
        : [];
}

export async function getPublicDealerCars(
    dealerId
) {
    if (!dealerId) {
        return [];
    }

    const cars =
        await apiClient.get(
            `/dealers/${dealerId}/cars`
        );

    return Array.isArray(cars)
        ? cars
        : [];
}

export async function getPublicCompanyCars(
    companyId
) {
    if (!companyId) {
        return [];
    }

    const cars =
        await apiClient.get(
            `/companies/${companyId}/cars`
        );

    return Array.isArray(cars)
        ? cars
        : [];
}
