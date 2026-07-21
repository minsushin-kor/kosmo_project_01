import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../../components/common/ImageUploader";
import "../../css/car/dealerRegisterCarPage.css";
import { saveDealerCarToStorage } from "../../utils/dealerCarStorage";
import { AUTH_ROLES } from "../../data/authUser";
import { useAuth } from "../../hooks/useAuth";

function DealerRegisterCarPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const isMember =
    loginUser?.role === AUTH_ROLES.MEMBER;

  const isDealer =
    loginUser?.role === AUTH_ROLES.DEALER;

  const [carImages, setCarImages] = useState([]);

  const carOptions = [
    "네비게이션",
    "열선시트",
    "통풍시트",
    "차체자세제어장치(ESC)",
    "썬루프",
  ];

  const [formData, setFormData] = useState({
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

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleOptionChange(e) {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      option: checked
        ? [...prev.option, value]
        : prev.option.filter(
            (item) => item !== value
          ),
    }));
  }

  function validateForm() {
    if (!loginUser) {
      alert("로그인이 필요합니다.");
      return false;
    }

    if (!isMember && !isDealer) {
      alert("매물 등록 권한이 없습니다.");
      return false;
    }

    if (carImages.length === 0) {
      alert(
        "차량 사진을 1장 이상 첨부해주세요."
      );
      return false;
    }

    if (
      !formData.year ||
      !formData.make ||
      !formData.model
    ) {
      alert(
        "연식, 제조사, 모델명을 입력해주세요."
      );
      return false;
    }

    if (!formData.body) {
      alert("차종을 입력해주세요.");
      return false;
    }

    if (!formData.transmission) {
      alert("변속기를 선택해주세요.");
      return false;
    }

    if (!formData.state) {
      alert("지역을 입력해주세요.");
      return false;
    }

    if (!formData.odometer) {
      alert("주행거리를 입력해주세요.");
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

    if (Number(formData.price) <= 0) {
      alert(
        isMember
          ? "경매 시작가는 0보다 커야 합니다."
          : "판매 가격은 0보다 커야 합니다."
      );
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const now = new Date();
    const endDate = new Date(
      now.getTime() +
        7 * 24 * 60 * 60 * 1000
    );

    const requestData = new FormData();

    requestData.append(
      "year",
      Number(formData.year)
    );
    requestData.append(
      "make",
      formData.make
    );
    requestData.append(
      "model",
      formData.model
    );
    requestData.append(
      "option",
      formData.option.join(", ")
    );
    requestData.append(
      "body",
      formData.body
    );
    requestData.append(
      "transmission",
      formData.transmission
    );
    requestData.append(
      "state",
      formData.state
    );
    requestData.append(
      "odometer",
      Number(formData.odometer)
    );
    requestData.append(
      "color",
      formData.color
    );
    requestData.append(
      "interior",
      formData.interior
    );
    requestData.append(
      "price",
      Number(formData.price)
    );
    requestData.append(
      "saleType",
      isMember ? "AUCTION" : "NORMAL"
    );

    carImages.forEach((image) => {
      requestData.append(
        "carImages",
        image.file
      );
    });

    const newCarId = Date.now();

    const newCar = {
      id: newCarId,

      year: Number(formData.year),
      make: formData.make,
      model: formData.model,
      name: `${formData.year} ${formData.make} ${formData.model}`,

      brand: formData.make,
      modelName: formData.model,
      carName: `${formData.make} ${formData.model}`,

      option: formData.option.join(", "),
      options: formData.option,

      body: formData.body,
      transmission: formData.transmission,

      state: formData.state,
      region: formData.state,

      odometer: Number(
        formData.odometer
      ),
      mileage: Number(
        formData.odometer
      ),

      color:
        formData.color || "-",
      interior:
        formData.interior || "-",

      sellingprice: Number(
        formData.price
      ),
      price: Number(formData.price),

      status: isMember
        ? "경매중"
        : "판매중",

      sellerType: isMember
        ? "일반회원"
        : "회사딜러",

      saleType: isMember
        ? "AUCTION"
        : "NORMAL",

      dealerId: isMember
        ? null
        : loginUser?.id || 1,

      memberId: isMember
        ? loginUser?.id || 1
        : null,

      companyId: isMember
        ? null
        : loginUser?.companyId || 1,

      sellerName:
        loginUser?.name ||
        (isMember
          ? "일반회원"
          : "김딜러"),

      sellerPhone:
        loginUser?.phone ||
        "010-1234-5678",

      companyName: isMember
        ? "개인 판매"
        : loginUser?.companyName ||
          "Kosmo 인증모터스",

      imageName:
        carImages[0]?.file?.name || "",

      imageText:
        formData.model || "CAR",

      images: carImages.map(
        (image, index) => ({
          id: `${newCarId}-${index}`,
          name:
            image.file?.name ||
            `car-image-${index + 1}`,
          previewUrl:
            image.previewUrl ||
            image.url ||
            "",
        })
      ),

      fuel: "-",
      displacement: "-",
      accident: "-",
      carNumber: "-",

      registeredDate: now
        .toISOString()
        .slice(0, 10),

      createdAt: now.toISOString(),

      description: isMember
        ? "일반회원이 등록한 비공개 입찰 경매 차량입니다."
        : "회사 소속 딜러가 등록한 일반 판매 차량입니다.",

      auction: isMember
        ? {
            auctionId: newCarId,
            startPrice: Number(
              formData.price
            ),
            bidCount: 0,
            startDate:
              now.toISOString(),
            endDate:
              endDate.toISOString(),
            status: "경매중",
            winningBidPrice: null,
            winningBidderName: null,
          }
        : null,
    };

    try {
      console.log(
        isMember
          ? "일반회원 경매 매물 등록 FormData 확인"
          : "딜러 일반 판매 매물 등록 FormData 확인"
      );

      for (
        const pair of requestData.entries()
      ) {
        console.log(
          pair[0],
          pair[1]
        );
      }

      saveDealerCarToStorage(newCar);

      // 백엔드 연결 전이라 일단 주석 처리
      // await registerCar(requestData);

      alert(
        isMember
          ? "경매 매물이 등록되었습니다."
          : "판매 매물이 등록되었습니다."
      );

      navigate("/");
    } catch (error) {
      console.error(error);

      alert(
        isMember
          ? "경매 매물 등록 중 오류가 발생했습니다."
          : "판매 매물 등록 중 오류가 발생했습니다."
      );
    }
  }

  return (
    <div className="dealer-register-page">
      <div className="dealer-register-container">
        <div className="dealer-register-header">
          <h2>
            {isMember
              ? "일반회원 중고차 매물 등록"
              : "딜러 판매 매물 등록"}
          </h2>

          <p>
            {isMember
              ? "일반회원이 등록한 차량은 회사와 딜러가 참여하는 비공개 입찰 경매로 진행됩니다."
              : "회사에서 생성한 딜러 계정은 일반 중고거래 매물을 등록합니다."}
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
                <label>연식</label>

                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="예: 2021"
                />
              </div>

              <div className="form-group">
                <label>제조사</label>

                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  placeholder="예: 현대"
                />
              </div>

              <div className="form-group">
                <label>모델명</label>

                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="예: 아반떼 CN7"
                />
              </div>

              <div className="form-group">
                <label>차종</label>

                <input
                  type="text"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="예: 세단"
                />
              </div>

              <div className="form-group">
                <label>변속기</label>

                <select
                  name="transmission"
                  value={
                    formData.transmission
                  }
                  onChange={handleChange}
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
                <label>지역</label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="예: 서울특별시"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>차량 사진</h3>

            <ImageUploader
              label="차량 사진 첨부"
              images={carImages}
              setImages={setCarImages}
              multiple={true}
              maxCount={10}
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
                      checked={formData.option.includes(
                        option
                      )}
                      onChange={
                        handleOptionChange
                      }
                    />

                    <span>{option}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>상세 정보</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>주행거리</label>

                <input
                  type="number"
                  name="odometer"
                  value={
                    formData.odometer
                  }
                  onChange={handleChange}
                  placeholder="예: 35000"
                />
              </div>

              <div className="form-group">
                <label>외장 색상</label>

                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="예: 화이트"
                />
              </div>

              <div className="form-group">
                <label>내장 색상</label>

                <input
                  type="text"
                  name="interior"
                  value={
                    formData.interior
                  }
                  onChange={handleChange}
                  placeholder="예: 블랙"
                />
              </div>

              <div className="form-group">
                <label>
                  {isMember
                    ? "경매 시작가"
                    : "판매 가격"}
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
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
              {isMember
                ? "등록한 차량은 7일 동안 비공개 입찰 경매로 진행됩니다. 회사와 회사 소속 딜러만 입찰할 수 있습니다."
                : "회사 소속 딜러가 등록한 차량은 일반회원에게 일반 중고거래 방식으로 판매됩니다."}
            </p>
          </div>

          <div className="form-button-area">
            <button
              type="submit"
              className="submit-button"
            >
              {isMember
                ? "경매 매물 등록"
                : "판매 매물 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DealerRegisterCarPage;