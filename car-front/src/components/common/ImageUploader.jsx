import {
  useEffect,
  useRef,
} from "react";
import "../../css/common/imageUploader.css";

function ImageUploader({
  label = "이미지 첨부",
  images,
  setImages,
  multiple = false,
  maxCount = 1,
  disabled = false,
}) {
  const fileInputRef =
    useRef(null);

  const latestImagesRef =
    useRef(images);

  /*
   * 항상 최신 이미지 목록을 ref에 보관합니다.
   * 이미지가 바뀔 때마다 URL을 해제하지 않고,
   * 컴포넌트가 완전히 사라질 때만 정리합니다.
   */
  useEffect(() => {
    latestImagesRef.current =
      images;
  }, [images]);

  useEffect(() => {
    return () => {
      latestImagesRef.current.forEach(
        (image) => {
          if (
            image?.previewUrl?.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              image.previewUrl
            );
          }
        }
      );
    };
  }, []);

  function handleClickUpload() {
    if (disabled) {
      return;
    }

    fileInputRef.current?.click();
  }

  function revokePreviewUrl(image) {
    if (
      image?.previewUrl?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        image.previewUrl
      );
    }
  }

  function revokePreviewUrls(
    imageList
  ) {
    imageList.forEach(
      revokePreviewUrl
    );
  }

  function handleChangeImages(e) {
    const selectedFiles =
      Array.from(
        e.target.files || []
      );

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const imageFiles =
      selectedFiles.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      );

    if (
      imageFiles.length !==
      selectedFiles.length
    ) {
      alert(
        "이미지 파일만 첨부할 수 있습니다."
      );

      e.target.value = "";
      return;
    }

    const newImages =
      imageFiles.map(
        (file) => ({
          id:
            crypto.randomUUID?.() ||
            `${file.name}-${Date.now()}-${Math.random()}`,

          file,

          previewUrl:
            URL.createObjectURL(
              file
            ),
        })
      );

    if (multiple) {
      const nextImages = [
        ...images,
        ...newImages,
      ];

      if (
        nextImages.length >
        maxCount
      ) {
        revokePreviewUrls(
          newImages
        );

        alert(
          `이미지는 최대 ${maxCount}장까지 첨부할 수 있습니다.`
        );

        e.target.value = "";
        return;
      }

      setImages(nextImages);
    } else {
      revokePreviewUrls(images);

      setImages(
        newImages.slice(0, 1)
      );
    }

    e.target.value = "";
  }

  function handleRemoveImage(
    imageId
  ) {
    setImages((prev) => {
      const removeTarget =
        prev.find(
          (image) =>
            image.id === imageId
        );

      revokePreviewUrl(
        removeTarget
      );

      return prev.filter(
        (image) =>
          image.id !== imageId
      );
    });
  }

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
          onClick={
            handleClickUpload
          }
          disabled={disabled}
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
        onChange={
          handleChangeImages
        }
        disabled={disabled}
      />

      {images.length > 0 ? (
        <div className="image-preview-list">
          {images.map(
            (image, index) => (
              <div
                className="image-preview-item"
                key={image.id}
              >
                <img
                  src={
                    image.previewUrl
                  }
                  alt={`첨부 이미지 ${index + 1}`}
                />

                {multiple &&
                  index === 0 ? (
                  <span className="main-image-badge">
                    대표
                  </span>
                ) : null}

                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() =>
                    handleRemoveImage(
                      image.id
                    )
                  }
                  disabled={disabled}
                >
                  삭제
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="image-empty-box">
          <span>
            선택된 이미지가 없습니다.
          </span>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;