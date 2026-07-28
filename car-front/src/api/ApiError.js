class ApiError extends Error {
    constructor({
        message,
        status = 0,
        code = "",
        data = null,
    }) {
        super(
            message ||
            "요청 처리 중 오류가 발생했습니다."
        );

        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

export default ApiError;