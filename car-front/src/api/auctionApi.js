import apiClient from "./apiClient";

/**
 * 딜러가 경매 차량에 입찰합니다.
 *
 * @param {number|string} auctionId 경매 ID
 * @param {number} bidAmount 입찰 금액
 * @returns {Promise<object>} 생성된 입찰 정보
 */
export async function placeAuctionBid(
    auctionId,
    bidAmount
) {
    if (!auctionId) {
        throw new Error(
            "경매 ID를 확인할 수 없습니다."
        );
    }

    const normalizedBidAmount =
        Number(bidAmount);

    if (
        !Number.isFinite(
            normalizedBidAmount
        ) ||
        normalizedBidAmount <= 0
    ) {
        throw new Error(
            "올바른 입찰 금액을 입력해주세요."
        );
    }

    return apiClient.post(
        `/auctions/${auctionId}/bids`,
        {
            bidAmount:
                normalizedBidAmount,
        }
    );
}

/**
 * 일반회원이 본인 차량에 들어온 입찰 목록을 조회합니다.
 *
 * @param {number|string} carId 차량 ID
 * @returns {Promise<Array>} 입찰 목록
 */
export async function getSellerAuctionBids(
    carId
) {
    if (!carId) {
        return [];
    }

    const result =
        await apiClient.get(
            `/cars/${carId}/bids`
        );

    return Array.isArray(result)
        ? result
        : [];
}

/**
 * 일반회원 또는 관리자가 경매를 마감합니다.
 *
 * @param {number|string} auctionId 경매 ID
 * @returns {Promise<object>} 경매 마감 결과
 */
export async function closeAuction(
    auctionId
) {
    if (!auctionId) {
        throw new Error(
            "경매 ID를 확인할 수 없습니다."
        );
    }

    return apiClient.post(
        `/auctions/${auctionId}/close`
    );
}