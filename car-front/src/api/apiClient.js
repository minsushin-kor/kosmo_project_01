import axios from "axios";
import {
    clearAuth,
    getAuthToken,
} from "../data/authUser";
import ApiError from "./ApiError";

const SERVER_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.trim();

if (!SERVER_BASE_URL) {
    console.warn(
        "VITE_API_BASE_URL 환경변수가 설정되지 않았습니다."
    );
}

const apiClient = axios.create({
    baseURL: `${SERVER_BASE_URL || ""
        }/api`,

    timeout: 15000,

    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

function createApiError(error) {
    const response = error.response;

    const responseData =
        response?.data || null;

    const errorDetail =
        responseData?.error || null;

    const message =
        errorDetail?.message ||
        responseData?.message ||
        error.message ||
        "요청 처리 중 오류가 발생했습니다.";

    return new ApiError({
        message,
        status: response?.status || 0,
        code: errorDetail?.code || "",
        data: responseData,
    });
}

apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(
            createApiError(error)
        );
    }
);

apiClient.interceptors.response.use(
    (response) => {
        const responseBody = response.data;

        const isSpringApiResponse =
            responseBody &&
            typeof responseBody === "object" &&
            Object.prototype.hasOwnProperty.call(
                responseBody,
                "success"
            );

        if (!isSpringApiResponse) {
            return responseBody;
        }

        if (responseBody.success) {
            return responseBody.data;
        }

        throw new ApiError({
            message:
                responseBody.error?.message ||
                responseBody.message ||
                "요청 처리에 실패했습니다.",

            status: response.status,

            code:
                responseBody.error?.code || "",

            data: responseBody,
        });
    },

    (error) => {
        const apiError =
            error instanceof ApiError
                ? error
                : createApiError(error);

        if (apiError.status === 401) {
            clearAuth();

            const currentPath =
                window.location.pathname;

            const isLoginPage =
                currentPath === "/login";

            if (!isLoginPage) {
                window.location.replace(
                    `/login?expired=true&from=${encodeURIComponent(
                        currentPath
                    )}`
                );
            }
        }

        if (apiError.status === 403) {
            const currentPath =
                window.location.pathname;

            if (
                currentPath !== "/forbidden"
            ) {
                window.location.replace(
                    "/forbidden"
                );
            }
        }

        return Promise.reject(apiError);
    }
);

export default apiClient;