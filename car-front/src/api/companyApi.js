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
    dealers
) {
    if (
        !Array.isArray(dealers) ||
        dealers.length === 0
    ) {
        return [];
    }

    const carRequests =
        dealers.map((dealer) => {
            const dealerId =
                dealer.dealerId ||
                dealer.id;

            return getPublicDealerCars(
                dealerId
            ).catch((error) => {
                console.error(
                    `딜러 ${dealerId} 차량 조회 실패:`,
                    error
                );

                return [];
            });
        });

    const dealerCarLists =
        await Promise.all(
            carRequests
        );

    return dealerCarLists.flat();
}