import axios from "axios";
import { resolvePublicImageUrl } from "../utils/imageUrl";

const SERVER_BASE_URL =
    (
        import.meta.env.VITE_API_BASE_URL?.trim() ||
        ""
    ).replace(/\/+$/, "");

/*
 * VITE_API_BASE_URL을
 * http://localhost:8080 또는
 * http://localhost:8080/api 형태로 설정해도
 * 최종 API 주소가 중복되지 않도록 처리합니다.
 */
const API_BASE_URL =
    SERVER_BASE_URL.endsWith("/api")
        ? SERVER_BASE_URL
        : `${SERVER_BASE_URL}/api`;

function extractUploadResponse(response) {
    return (
        response?.data?.data ??
        response?.data ??
        response
    );
}

function extractErrorMessage(error) {
    const responseData =
        error?.response?.data;

    const errorDetail =
        responseData?.error;

    if (
        typeof errorDetail ===
        "string"
    ) {
        return errorDetail;
    }

    return (
        errorDetail?.message ||
        responseData?.message ||
        error?.message ||
        "이미지 업로드 중 오류가 발생했습니다."
    );
}

export async function uploadImage(
    file,
    category = "common"
) {
    if (!(file instanceof File)) {
        throw new Error(
            "업로드할 이미지 파일이 없습니다."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file,
        file.name
    );

    formData.append(
        "category",
        category
    );

    try {
        const response =
            await axios.post(
                `${API_BASE_URL}/images/upload`,
                formData,
                {
                    /*
                     * Content-Type은 직접 지정하지 않습니다.
                     *
                     * 브라우저가 multipart/form-data와
                     * boundary를 자동으로 생성해야 합니다.
                     */
                    timeout: 30000,
                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        const uploadedImage =
            extractUploadResponse(
                response
            );

        if (!uploadedImage?.imageUrl) {
            throw new Error(
                "서버에서 이미지 주소를 받지 못했습니다."
            );
        }

        return {
            ...uploadedImage,
            imageUrl:
                resolvePublicImageUrl(
                    uploadedImage.imageUrl
                ),
        };
    } catch (error) {
        console.error(
            "이미지 업로드 실패:",
            error
        );

        throw new Error(
            extractErrorMessage(
                error
            ),
            {
                cause: error,
            }
        );
    }
}

export async function uploadImages(
    images,
    category = "common"
) {
    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {
        return [];
    }

    const uploadedImages = [];

    for (
        let index = 0;
        index < images.length;
        index += 1
    ) {
        const imageItem =
            images[index];

        const file =
            imageItem instanceof File
                ? imageItem
                : imageItem?.file;

        if (!(file instanceof File)) {
            continue;
        }

        const uploadedImage =
            await uploadImage(
                file,
                category
            );

        uploadedImages.push({
            imageUrl:
                uploadedImage.imageUrl,

            isMain:
                uploadedImages.length ===
                0,
        });
    }

    return uploadedImages;
}
