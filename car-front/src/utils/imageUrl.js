/**
 * Spring이 localhost가 포함된 업로드 주소를 반환하더라도
 * 현재 React 서버의 /uploads 프록시를 통해 접근하도록 변환합니다.
 */
export function resolvePublicImageUrl(imageUrl) {
  const value = String(imageUrl || "").trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("uploads/")) {
    return `/${value}`;
  }

  try {
    const baseUrl =
      globalThis.location?.origin ||
      "http://localhost";
    const parsedUrl =
      new URL(value, baseUrl);

    if (
      parsedUrl.pathname.startsWith(
        "/uploads/"
      )
    ) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return value;
  }

  return value;
}
