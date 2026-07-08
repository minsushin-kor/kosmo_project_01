import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../../components/common/ImageUploader";
import "../../css/car/dealerRegisterCarPage.css";
import { saveDealerCarToStorage } from "../../utils/dealerCarStorage";

function DealerRegisterCarPage() {
  const navigate = useNavigate();
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

    auctionStartPrice: "",
    auctionStartDate: "",
    auctionEndDate: "",
    auctionStatus: "경매중",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleOptionChange(e) {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      option: checked
        ? [...prev.option, value]
        : prev.option.filter((item) => item !== value),
    }));
  }

  function validateForm() {
    if (carImages.length === 0) {
      alert("차량 사진을 1장 이상 첨부해주세요.");
      return false;
    }

    if (!formData.year || !formData.make || !formData.model) {
      alert("연식, 제조사, 모델명을 입력해주세요.");
      return false;
    }

    if (!formData.auctionStartPrice) {
      alert("경매 시작가를 입력해주세요.");
      return false;
    }

    if (!formData.auctionStartDate || !formData.auctionEndDate) {
      alert("입찰 시작일과 마감일을 입력해주세요.");
      return false;
    }

    const startDate = new Date(formData.auctionStartDate);
    const endDate = new Date(formData.auctionEndDate);

    if (startDate >= endDate) {
      alert("입찰 마감일은 시작일보다 뒤로 설정해야 합니다.");
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const requestData = new FormData();

    requestData.append("year", Number(formData.year));
    requestData.append("make", formData.make);
    requestData.append("model", formData.model);
    requestData.append("option", formData.option.join(", "));
    requestData.append("body", formData.body);
    requestData.append("transmission", formData.transmission);
    requestData.append("state", formData.state);
    requestData.append("odometer", Number(formData.odometer));
    requestData.append("color", formData.color);
    requestData.append("interior", formData.interior);

    requestData.append("auctionStartPrice", Number(formData.auctionStartPrice));
    requestData.append("auctionStartDate", formData.auctionStartDate);
    requestData.append("auctionEndDate", formData.auctionEndDate);
    requestData.append("auctionStatus", formData.auctionStatus);

    carImages.forEach((image) => {
      requestData.append("carImages", image.file);
    });

    const newCar = {
      id: Date.now(),

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

      odometer: Number(formData.odometer),
      mileage: Number(formData.odometer),

      color: formData.color,
      interior: formData.interior,

      sellingprice: Number(formData.auctionStartPrice),
      price: Number(formData.auctionStartPrice),

      status: formData.auctionStatus,
      sellerType: "딜러",

      dealerId: 1,
      memberId: null,
      companyId: 1,

      sellerName: "김딜러",
      sellerPhone: "010-1234-5678",
      companyName: "Kosmo 인증모터스",

      imageName: carImages[0]?.file?.name || "",
      imageText: formData.model || "CAR",

      fuel: "-",
      displacement: "-",
      accident: "-",
      carNumber: "-",

      registeredDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),

      description: "딜러가 등록한 경매 차량입니다.",

      auction: {
        auctionId: Date.now(),
        startPrice: Number(formData.auctionStartPrice),
        bidCount: 0,
        startDate: formData.auctionStartDate,
        endDate: formData.auctionEndDate,
        status: formData.auctionStatus,
        winningBidPrice: null,
        winningBidderName: null,
      },
    };

    try {
      console.log("경매 매물 등록 FormData 확인");

      for (const pair of requestData.entries()) {
        console.log(pair[0], pair[1]);
      }

      saveDealerCarToStorage(newCar);

      // 백엔드 연결 전이라 일단 주석 처리
      // await registerCar(requestData);

      alert("경매 매물이 등록되었습니다.");

      navigate("/dealer/cars");
    } catch (error) {
      console.error(error);
      alert("경매 매물 등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="dealer-register-page">
      <div className="dealer-register-container">
        <div className="dealer-register-header">
          <h2>딜러 경매 매물 등록</h2>
          <p>경매로 진행할 차량 정보와 입찰 기간을 입력하세요.</p>
        </div>

        <form className="dealer-register-form" onSubmit={handleSubmit}>
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
                  value={formData.transmission}
                  onChange={handleChange}
                >
                  <option value="">선택</option>
                  <option value="자동">자동</option>
                  <option value="수동">수동</option>
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
              {carOptions.map((option) => (
                <label className="option-checkbox-item" key={option}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={formData.option.includes(option)}
                    onChange={handleOptionChange}
                  />
                  <span>{option}</span>
                </label>
              ))}
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
                  value={formData.odometer}
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
                  placeholder="예: 흰색"
                />
              </div>

              <div className="form-group">
                <label>내장 색상</label>
                <input
                  type="text"
                  name="interior"
                  value={formData.interior}
                  onChange={handleChange}
                  placeholder="예: 검정"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>경매 정보</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>경매 시작가</label>
                <input
                  type="number"
                  name="auctionStartPrice"
                  value={formData.auctionStartPrice}
                  onChange={handleChange}
                  placeholder="예: 1650"
                />
              </div>

              <div className="form-group">
                <label>입찰 시작일</label>
                <input
                  type="datetime-local"
                  name="auctionStartDate"
                  value={formData.auctionStartDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>입찰 마감일</label>
                <input
                  type="datetime-local"
                  name="auctionEndDate"
                  value={formData.auctionEndDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>경매 상태</label>
                <select
                  name="auctionStatus"
                  value={formData.auctionStatus}
                  onChange={handleChange}
                >
                  <option value="경매중">경매중</option>
                  <option value="경매예정">경매예정</option>
                </select>
              </div>
            </div>
          </div>

          <div className="register-info-box">
            <p>
              비공개 입찰 방식이라 구매자 화면에는 다른 사람의 입찰 금액이나
              최고 입찰가가 보이지 않습니다. 판매자 화면에서만 입찰 현황을
              확인하고 낙찰처리를 할 수 있게 만들 예정입니다.
            </p>
          </div>

          <div className="form-button-area">
            <button type="submit" className="submit-button">
              경매 매물 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DealerRegisterCarPage;