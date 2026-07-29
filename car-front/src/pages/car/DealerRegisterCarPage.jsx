import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import ImageUploader from "../../components/common/ImageUploader";
import {
  getCarDetail,
  registerCar,
  updateCar,
} from "../../api/carApi";
import {
  uploadImages,
} from "../../api/imageApi";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import {
  useAuth,
} from "../../hooks/useAuth";
import "../../css/car/dealerRegisterCarPage.css";

function DealerRegisterCarPage() {
  const navigate = useNavigate();

  const { carId } =
    useParams();

  const isEditMode =
    Boolean(carId);

  const {
    loginUser,
  } = useAuth();

  const isMember =
    loginUser?.role ===
    AUTH_ROLES.MEMBER;

  const isDealer =
    loginUser?.role ===
    AUTH_ROLES.DEALER;

  const [
    carImages,
    setCarImages,
  ] = useState([]);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    isEditMode
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const carOptions = [
    "네비게이션",
    "열선시트",
    "통풍시트",
    "차체자세제어장치(ESC)",
    "썬루프",
  ];

  const [
    formData,
    setFormData,
  ] = useState({
    year: "",
    make: "",
    model: "",
    option: [],
    body: "",
    transmission: "",
    state: "",
    odometer: "",
    color: "",
    interior: "",
    price: "",
  });

  useEffect(() => {
    let isCancelled = false;

    if (!isEditMode) {
      return undefined;
    }

    getCarDetail(carId)
      .then((car) => {
        if (isCancelled) {
          return;
        }

        const existingImages =
          Array.isArray(
            car?.images
          )
            ? car.images
              .filter(
                (image) =>
                  Boolean(
                    image?.imageUrl
                  )
              )
              .map(
                (
                  image,
                  index
                ) => ({
                  id:
                    image.carImageId ||
                    image.id ||
                    `saved-${index}`,

                  previewUrl:
                    image.imageUrl,

                  imageUrl:
                    image.imageUrl,

                  isExisting:
                    true,
                })
              )
            : [];

        setFormData({
          year:
            car?.year
              ? String(car.year)
              : "",

          make:
            car?.make ||
            car?.brand ||
            "",

          model:
            car?.model ||
            car?.modelName ||
            "",

          option:
            Array.isArray(
              car?.options
            )
              ? car.options
              : [],

          body:
            car?.body &&
              car.body !== "-"
              ? car.body
              : "",

          transmission:
            car?.transmission &&
              car.transmission !== "-"
              ? car.transmission
              : "",

          state:
            car?.state &&
              car.state !== "-"
              ? car.state
              : "",

          odometer:
            car?.odometer != null
              ? String(
                car.odometer
              )
              : "",

          color:
            car?.color &&
              car.color !== "-"
              ? car.color
              : "",

          interior:
            car?.interior &&
              car.interior !== "-"
              ? car.interior
              : "",

          price:
            car?.sellingPrice != null
              ? String(
                car.sellingPrice
              )
              : "",
        });

        setCarImages(
          existingImages
        );

        setLoadError("");
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "수정할 차량 조회 실패:",
          error
        );

        setLoadError(
          error?.message ||
          "수정할 차량 정보를 불러오지 못했습니다."
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    carId,
    isEditMode,
  ]);

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleOptionChange(e) {
    const {
      value,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,

      option: checked
        ? [
          ...prev.option,
          value,
        ]
        : prev.option.filter(
          (item) =>
            item !== value
        ),
    }));
  }

  function validateForm() {
    if (!loginUser) {
      alert("로그인이 필요합니다.");
      return false;
    }

    if (
      !isMember &&
      !isDealer
    ) {
      alert(
        "매물 등록 권한이 없습니다."
      );
      return false;
    }

    if (carImages.length === 0) {
      alert(
        "차량 사진을 1장 이상 첨부해주세요."
      );
      return false;
    }

    if (!formData.year) {
      alert("연식을 입력해주세요.");
      return false;
    }

    if (!formData.make.trim()) {
      alert("제조사를 입력해주세요.");
      return false;
    }

    if (!formData.model.trim()) {
      alert("모델명을 입력해주세요.");
      return false;
    }

    if (!formData.body.trim()) {
      alert("차종을 입력해주세요.");
      return false;
    }

    if (!formData.transmission) {
      alert(
        "변속기를 선택해주세요."
      );
      return false;
    }

    if (!formData.state.trim()) {
      alert("지역을 입력해주세요.");
      return false;
    }

    if (!formData.odometer) {
      alert(
        "주행거리를 입력해주세요."
      );
      return false;
    }

    if (!formData.price) {
      alert(
        isMember
          ? "경매 시작가를 입력해주세요."
          : "판매 가격을 입력해주세요."
      );
      return false;
    }

    const year =
      Number(formData.year);

    const odometer =
      Number(formData.odometer);

    const price =
      Number(formData.price);

    const currentYear =
      new Date().getFullYear();

    if (
      Number.isNaN(year) ||
      year < 1900 ||
      year > currentYear + 1
    ) {
      alert(
        "연식을 올바르게 입력해주세요."
      );
      return false;
    }

    if (
      Number.isNaN(odometer) ||
      odometer < 0
    ) {
      alert(
        "주행거리를 올바르게 입력해주세요."
      );
      return false;
    }

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
      alert(
        isMember
          ? "경매 시작가는 0보다 커야 합니다."
          : "판매 가격은 0보다 커야 합니다."
      );
      return false;
    }

    return true;
  }

  function formatLocalDateTime(
    date
  ) {
    const pad = (value) =>
      String(value).padStart(
        2,
        "0"
      );

    return [
      date.getFullYear(),
      "-",
      pad(
        date.getMonth() + 1
      ),
      "-",
      pad(
        date.getDate()
      ),
      "T",
      pad(
        date.getHours()
      ),
      ":",
      pad(
        date.getMinutes()
      ),
      ":",
      pad(
        date.getSeconds()
      ),
    ].join("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      isSubmitting ||
      !validateForm()
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const existingImages =
        carImages
          .filter(
            (image) =>
              image?.isExisting &&
              image?.imageUrl
          )
          .map(
            (image) => ({
              imageUrl:
                image.imageUrl,

              isMain:
                false,
            })
          );

      const newImages =
        carImages.filter(
          (image) =>
            image?.file instanceof
            File
        );

      const uploadedImages =
        await uploadImages(
          newImages,
          "car"
        );

      const combinedImages = [
        ...existingImages,
        ...uploadedImages,
      ].map(
        (image, index) => ({
          imageUrl:
            image.imageUrl,

          isMain:
            index === 0,
        })
      );

      if (
        combinedImages.length === 0
      ) {
        throw new Error(
          "차량 이미지를 1장 이상 등록해주세요."
        );
      }

      const now =
        new Date();

      const endDate =
        new Date(
          now.getTime() +
          3 * 60 * 60 * 1000
        );

      const requestData = {
        year:
          Number(formData.year),

        make:
          formData.make.trim(),

        model:
          formData.model.trim(),

        option:
          formData.option.join(
            ", "
          ),

        body:
          formData.body.trim(),

        transmission:
          formData.transmission,

        state:
          formData.state.trim(),

        condition: null,

        odometer:
          Number(
            formData.odometer
          ),

        color:
          formData.color.trim(),

        interior:
          formData.interior.trim(),

        sellingPrice:
          Number(
            formData.price
          ),

        images:
          combinedImages,

        startTime:
          isMember
            ? formatLocalDateTime(
              now
            )
            : null,

        endTime:
          isMember
            ? formatLocalDateTime(
              endDate
            )
            : null,
      };

      const savedCar =
        isEditMode
          ? await updateCar(
            carId,
            requestData
          )
          : await registerCar(
            requestData
          );

      console.log(
        isEditMode
          ? "차량 수정 API 응답"
          : "차량 등록 API 응답",
        savedCar
      );

      alert(
        isEditMode
          ? "매물 정보가 수정되었습니다."
          : (
            isMember
              ? "경매 매물이 등록되었습니다."
              : "판매 매물이 등록되었습니다."
          )
      );

      navigate(
        `/cars/${savedCar?.carId ||
        savedCar?.id ||
        carId
        }`,
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        isEditMode
          ? "차량 수정 오류"
          : "차량 등록 오류",
        error
      );

      alert(
        error?.message ||
        (
          isEditMode
            ? "매물 수정 중 오류가 발생했습니다."
            : (
              isMember
                ? "경매 매물 등록 중 오류가 발생했습니다."
                : "판매 매물 등록 중 오류가 발생했습니다."
            )
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="dealer-register-page">
        <div className="dealer-register-container">
          <div className="dealer-register-header">
            <h2>
              매물 정보를 불러오는 중입니다.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dealer-register-page">
        <div className="dealer-register-container">
          <div className="dealer-register-header">
            <h2>
              매물 정보를 불러오지 못했습니다.
            </h2>

            <p>
              {loadError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-register-page">
      <div className="dealer-register-container">
        <div className="dealer-register-header">
          <h2>
            {isEditMode
              ? (
                isMember
                  ? "일반회원 경매 매물 수정"
                  : "딜러 판매 매물 수정"
              )
              : (
                isMember
                  ? "일반회원 중고차 매물 등록"
                  : "딜러 판매 매물 등록"
              )}
          </h2>

          <p>
            {isEditMode
              ? "본인이 등록한 매물 정보와 차량 이미지를 수정합니다."
              : (
                isMember
                  ? "일반회원이 등록한 차량은 회사와 딜러가 참여하는 비공개 입찰 경매로 진행됩니다."
                  : "회사에서 생성한 딜러 계정은 일반 중고거래 매물을 등록합니다."
              )}
          </p>
        </div>

        <form
          className="dealer-register-form"
          onSubmit={handleSubmit}
        >
          <div className="form-section">
            <h3>기본 정보</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="car-year">
                  연식
                </label>

                <input
                  id="car-year"
                  type="number"
                  name="year"
                  value={
                    formData.year
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 2021"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-make">
                  제조사
                </label>

                <input
                  id="car-make"
                  type="text"
                  name="make"
                  value={
                    formData.make
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 현대"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-model">
                  모델명
                </label>

                <input
                  id="car-model"
                  type="text"
                  name="model"
                  value={
                    formData.model
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 캐스퍼"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-body">
                  차종
                </label>

                <input
                  id="car-body"
                  type="text"
                  name="body"
                  value={
                    formData.body
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 경차"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-transmission">
                  변속기
                </label>

                <select
                  id="car-transmission"
                  name="transmission"
                  value={
                    formData.transmission
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                >
                  <option value="">
                    선택
                  </option>

                  <option value="자동">
                    자동
                  </option>

                  <option value="수동">
                    수동
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="car-state">
                  지역
                </label>

                <input
                  id="car-state"
                  type="text"
                  name="state"
                  value={
                    formData.state
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 경기도"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>차량 사진</h3>

            <p className="register-image-api-notice">
              첫 번째 사진이 대표 이미지로 저장됩니다.
              기존 사진을 삭제하거나 새 사진을 추가할 수 있습니다.
            </p>

            <ImageUploader
              label="차량 사진 첨부"
              images={carImages}
              setImages={setCarImages}
              multiple={true}
              maxCount={10}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-section">
            <h3>차량 옵션</h3>

            <div className="option-checkbox-list">
              {carOptions.map(
                (option) => (
                  <label
                    className="option-checkbox-item"
                    key={option}
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={
                        formData.option.includes(
                          option
                        )
                      }
                      onChange={
                        handleOptionChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                    <span>
                      {option}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>상세 정보</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="car-odometer">
                  주행거리
                </label>

                <input
                  id="car-odometer"
                  type="number"
                  name="odometer"
                  min="0"
                  value={
                    formData.odometer
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 12000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-color">
                  외장 색상
                </label>

                <input
                  id="car-color"
                  type="text"
                  name="color"
                  value={
                    formData.color
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 화이트"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-interior">
                  내장 색상
                </label>

                <input
                  id="car-interior"
                  type="text"
                  name="interior"
                  value={
                    formData.interior
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 블랙"
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-price">
                  {isMember
                    ? "경매 시작가"
                    : "판매 가격"}
                </label>

                <input
                  id="car-price"
                  type="number"
                  name="price"
                  min="1"
                  value={
                    formData.price
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder={
                    isMember
                      ? "예: 1500"
                      : "예: 1650"
                  }
                />
              </div>
            </div>
          </div>

          <div className="register-info-box">
            <p>
              {isEditMode
                ? "수정된 내용은 저장 즉시 차량 상세페이지에 반영됩니다."
                : (
                  isMember
                    ? "등록한 차량은 3시간 동안 비공개 입찰 경매로 진행됩니다. 회사 소속 딜러만 입찰할 수 있습니다."
                    : "회사 소속 딜러가 등록한 차량은 일반회원에게 일반 중고거래 방식으로 판매됩니다."
                )}
            </p>
          </div>

          <div className="form-button-area">
            <button
              type="submit"
              className="submit-button"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? (
                  isEditMode
                    ? "매물 수정 중..."
                    : "이미지 업로드 및 등록 중..."
                )
                : (
                  isEditMode
                    ? "매물 수정"
                    : (
                      isMember
                        ? "경매 매물 등록"
                        : "판매 매물 등록"
                    )
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DealerRegisterCarPage;