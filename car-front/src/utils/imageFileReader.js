export function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("이미지를 불러오지 못했습니다."));
    };

    reader.readAsDataURL(file);
  });
}