import { useRef } from "react";
import "../../css/common/imageUploader.css";

function ImageUploader({
  label = "이미지 첨부",
  images,
  setImages,
  multiple = false,
  maxCount = 1,
}) {
  const fileInputRef = useRef(null);

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const handleChangeImages = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) {
      return;
    }

    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== selectedFiles.length) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }

    const newImages = imageFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file: file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (multiple) {
      const nextImages = [...images, ...newImages];

      if (nextImages.length > maxCount) {
        alert(`이미지는 최대 ${maxCount}장까지 첨부할 수 있습니다.`);
        e.target.value = "";
        return;
      }

      setImages(nextImages);
    } else {
      setImages(newImages.slice(0, 1));
    }

    e.target.value = "";
  };

  const handleRemoveImage = (imageId) => {
    setImages((prev) => {
      const removeTarget = prev.find((image) => image.id === imageId);

      if (removeTarget) {
        URL.revokeObjectURL(removeTarget.previewUrl);
      }

      return prev.filter((image) => image.id !== imageId);
    });
  };

  return (
    <div className="image-uploader">
      <div className="image-uploader-top">
        <div>
          <h4>{label}</h4>
          <p>
            {multiple
              ? `이미지는 최대 ${maxCount}장까지 첨부할 수 있습니다.`
              : "이미지는 1장만 첨부할 수 있습니다."}
          </p>
        </div>

        <button
          type="button"
          className="image-upload-btn"
          onClick={handleClickUpload}
        >
          이미지 선택
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="image-upload-input"
        onChange={handleChangeImages}
      />

      {images.length > 0 ? (
        <div className="image-preview-list">
          {images.map((image, index) => (
            <div className="image-preview-item" key={image.id}>
              <img src={image.previewUrl} alt={`첨부 이미지 ${index + 1}`} />

              {multiple && index === 0 && (
                <span className="main-image-badge">대표</span>
              )}

              <button
                type="button"
                className="image-remove-btn"
                onClick={() => handleRemoveImage(image.id)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="image-empty-box">
          <span>선택된 이미지가 없습니다.</span>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;