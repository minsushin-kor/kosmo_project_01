import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCar } from "../../api/carApi";
import "../../css/car/dealerRegisterCarPage.css";

function DealerRegisterCarPage() {
    const navigate = useNavigate();

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
        sellingprice: "",
        status: "판매중",
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

    async function handleSubmit(e) {
        e.preventDefault();

        const requestData = {
            ...formData,

            // 숫자로 저장해야 하는 값 변환
            year: Number(formData.year),
            odometer: Number(formData.odometer),
            sellingprice: Number(formData.sellingprice),

            // 체크박스 배열을 문자열로 변환
            option: formData.option.join(", "),
        };

        try {
            console.log("매물 등록 요청 데이터:", requestData);

            await registerCar(requestData);

            alert("매물이 등록되었습니다.");

            // 등록 성공 후 딜러 매물 목록 페이지로 이동
            navigate("/dealer/cars");
        } catch (error) {
            console.error(error);
            alert("매물 등록 중 오류가 발생했습니다.");
        }
    }

    return (
        <div className="dealer-register-page">
            <div className="dealer-register-container">
                <div className="dealer-register-header">
                    <h2>딜러 매물 등록</h2>
                    <p>판매할 차량 정보를 입력하세요.</p>
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

                            <div className="form-group">
                                <label>판매 가격</label>
                                <input
                                    type="number"
                                    name="sellingprice"
                                    value={formData.sellingprice}
                                    onChange={handleChange}
                                    placeholder="예: 16500000"
                                />
                            </div>

                            <div className="form-group">
                                <label>판매 상태</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="판매중">판매중</option>
                                    <option value="예약중">예약중</option>
                                    <option value="판매완료">판매완료</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="register-info-box">
                        <p>
                            차량 예상가격은 학습 모델을 이용 시세는 직접 입력하지 않고, 추후 백엔드 또는
                            AI 모델에서 계산된 값을 받아서 저장할예정, 추가로 예상가를 받은 이후에 등록버튼 활성화 or 생성
                            나중에 이 텍스트 박스는 다른걸로 활용하거나 지울까?
                        </p>
                    </div>

                    <div className="form-button-area">
                        <button type="submit" className="submit-button">
                            매물 등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DealerRegisterCarPage;