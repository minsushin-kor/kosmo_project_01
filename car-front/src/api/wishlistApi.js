import apiClient from "./apiClient";
import { getAuthUser } from "../data/authUser";

export const WISHLIST_CHANGE_EVENT =
  "wishlist-change";

let cachedCarIds = null;
let pendingCarIdsRequest = null;

export function clearWishlistCache() {
  cachedCarIds = null;
  pendingCarIdsRequest = null;
}

function normalizeCarIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((carId) =>
      Number(carId)
    )
    .filter(Number.isFinite);
}

function resolveResponseData(
  result
) {
  return result?.data ??
    result ??
    null;
}

function resolveWishlistState(
  result
) {
  const responseData =
    resolveResponseData(
      result
    );

  return Boolean(
    responseData?.isWished ??
    responseData?.wished
  );
}

/**
 * 로그인 사용자가 찜한 차량 ID 목록 조회
 */
export async function getWishlistCarIds({
  force = false,
} = {}) {
  if (
    !force &&
    Array.isArray(
      cachedCarIds
    )
  ) {
    return [
      ...cachedCarIds,
    ];
  }

  if (
    !force &&
    pendingCarIdsRequest
  ) {
    return pendingCarIdsRequest;
  }

  pendingCarIdsRequest =
    apiClient
      .get(
        "/wishlists/car-ids"
      )
      .then((result) => {
        const responseData =
          resolveResponseData(
            result
          );

        cachedCarIds =
          normalizeCarIds(
            responseData
          );

        return [
          ...cachedCarIds,
        ];
      })
      .finally(() => {
        pendingCarIdsRequest =
          null;
      });

  return pendingCarIdsRequest;
}

/**
 * 마이페이지에서 사용할 찜 차량 전체 목록 조회
 */
export async function getMyWishlists() {
  const result =
    await apiClient.get(
      "/wishlists"
    );

  const responseData =
    resolveResponseData(
      result
    );

  if (
    Array.isArray(
      responseData
    )
  ) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.content
    )
  ) {
    return responseData.content;
  }

  return [];
}

/**
 * 찜 등록 또는 해제
 */
export async function toggleWishlist(
  carId
) {
  const normalizedCarId =
    Number(carId);

  if (
    !Number.isFinite(
      normalizedCarId
    )
  ) {
    throw new Error(
      "올바르지 않은 차량 번호입니다."
    );
  }

  const result =
    await apiClient.post(
      `/wishlists/${normalizedCarId}`
    );

  const isWished =
    resolveWishlistState(
      result
    );

  const nextCarIds =
    new Set(
      cachedCarIds || []
    );

  if (isWished) {
    nextCarIds.add(
      normalizedCarId
    );
  } else {
    nextCarIds.delete(
      normalizedCarId
    );
  }

  cachedCarIds = [
    ...nextCarIds,
  ];

  const responseData =
    resolveResponseData(
      result
    );

  const normalizedResult = {
    ...(responseData || {}),
    carId:
      normalizedCarId,
    isWished,
  };

  const authUser = getAuthUser();
  window.dispatchEvent(
    new CustomEvent(
      WISHLIST_CHANGE_EVENT,
      {
        detail: {
          carId:
            normalizedCarId,
          isWished,
          userLoginId: authUser?.loginId || null,
          userRole: authUser?.role || null,
        },
      }
    )
  );

  return normalizedResult;
}