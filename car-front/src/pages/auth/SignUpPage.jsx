import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageUploader from "../../components/common/ImageUploader";
import { AUTH_ROLES, getRoleName } from "../../data/authUser";
import "../../css/auth/signUpPage.css";

const SIGNUP_STORAGE_KEY = "car_front_signup_users";

const SIGNUP_TYPES = {
  COMPANY: "COMPANY",
  MEMBER: "MEMBER",
};

const SIGNUP_TYPE_LABEL = {
  COMPANY: "기업",
  MEMBER: "일반회원",
};

const SIGNUP_TYPE_ROLE = {
  COMPANY: AUTH_ROLES.COMPANY,
  MEMBER: AUTH_ROLES.MEMBER,
};

const initialForm = {
  loginId: "",
  password: "",
  passwordCheck: "",
  name: "",
  phone: "",
  email: "",
  address: "",

  companyName: "",
  businessNumber: "",
  companyPhone: "",
  companyAddress: "",

  preferredCar: "",
  hasOwnCar: "N",
  ownCarMaker: "",
  ownCarModel: "",
  ownCarMileage: "",
  ownCarYear: "",
};

function SignUpPage() {
  const navigate = useNavigate();

  const [signupType, setSignupType] = useState(SIGNUP_TYPES.COMPANY);
  const [profileImages, setProfileImages] = useState([]);
  const [ownCarImages, setOwnCarImages] = useState([]);
  const [form, setForm] = useState(initialForm);

  const selectedRole = useMemo(() => {
    return SIGNUP_TYPE_ROLE[signupType];
  }, [signupType]);

  const isMember = signupType === SIGNUP_TYPES.MEMBER;
  const isCompany = signupType === SIGNUP_TYPES.COMPANY;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "hasOwnCar" && value === "N") {
      setOwnCarImages([]);
    }
  }

  function handleSignupTypeChange(type) {
    setSignupType(type);
    setProfileImages([]);
    setOwnCarImages([]);

    setForm({
      ...initialForm,
      hasOwnCar: "N",
    });
  }

  function validateForm() {
    if (!form.loginId.trim()) {
      alert("아이디를 입력하세요.");
      return false;
    }

    if (!form.password.trim()) {
      alert("비밀번호를 입력하세요.");
      return false;
    }

    if (form.password !== form.passwordCheck) {
      alert("비밀번호 확인이 맞지 않습니다.");
      return false;
    }

    if (!form.name.trim()) {
      alert("이름을 입력하세요.");
      return false;
    }

    if (!form.phone.trim()) {
      alert("연락처를 입력하세요.");
      return false;
    }

    if (!form.email.trim()) {
      alert("이메일을 입력하세요.");
      return false;
    }

    if (isCompany) {
      if (!form.companyName.trim()) {
        alert("회사명을 입력하세요.");
        return false;
      }

      if (!form.businessNumber.trim()) {
        alert("사업자번호를 입력하세요.");
        return false;
      }
    }

    if (isMember && form.hasOwnCar === "Y") {
      if (!form.ownCarMaker.trim()) {
        alert("차량 제조사를 입력하세요.");
        return false;
      }

      if (!form.ownCarModel.trim()) {
        alert("차량 모델을 입력하세요.");
        return false;
      }

      if (!form.ownCarMileage.trim()) {
        alert("미터수를 입력하세요.");
        return false;
      }

      if (!form.ownCarYear.trim()) {
        alert("연식을 입력하세요.");
        return false;
      }
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const savedUsers = JSON.parse(
      localStorage.getItem(SIGNUP_STORAGE_KEY) || "[]"
    );

    const newUser = {
      id: Date.now(),
      signupType,
      signupTypeName: SIGNUP_TYPE_LABEL[signupType],
      role: selectedRole,
      roleName: getRoleName(selectedRole),

      profileImageName: isCompany ? profileImages[0]?.file?.name || "" : "",
      profileImagePreviewUrl: isCompany
        ? profileImages[0]?.previewUrl || ""
        : "",

      ownCarImageNames:
        isMember && form.hasOwnCar === "Y"
          ? ownCarImages.map((image) => image.file?.name || "")
          : [],
      ownCarImagePreviewUrls:
        isMember && form.hasOwnCar === "Y"
          ? ownCarImages.map((image) => image.previewUrl || "")
          : [],

      ...form,
      password: "",
      passwordCheck: "",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      SIGNUP_STORAGE_KEY,
      JSON.stringify([newUser, ...savedUsers])
    );

    alert("회원가입이 완료되었습니다. 현재는 localStorage에 임시 저장됩니다.");
    navigate("/login");
  }

  return (
    <main className="signup-page">
      <section className="signup-box">
        <div className="signup-header">
          <h1>회원가입</h1>
          <p>회사계정, 일반회원 가입 폼</p>
        </div>

        <div className="signup-type-group">
          {Object.values(SIGNUP_TYPES).map((type) => (
            <button
              key={type}
              type="button"
              className={signupType === type ? "active" : ""}
              onClick={() => handleSignupTypeChange(type)}
            >
              {SIGNUP_TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-section">
            <h2>기본 정보</h2>

            {isCompany && (
              <ImageUploader
                label="회사 프로필 사진"
                images={profileImages}
                setImages={setProfileImages}
                multiple={false}
                maxCount={1}
              />
            )}

            <div className="signup-grid two">
              <div className="form-row">
                <label>아이디</label>
                <input
                  type="text"
                  name="loginId"
                  value={form.loginId}
                  onChange={handleChange}
                  placeholder="아이디"
                />
              </div>

              <div className="form-row">
                <label>이름</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="이름"
                />
              </div>

              <div className="form-row">
                <label>비밀번호</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="비밀번호"
                />
              </div>

              <div className="form-row">
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  name="passwordCheck"
                  value={form.passwordCheck}
                  onChange={handleChange}
                  placeholder="비밀번호 확인"
                />
              </div>

              <div className="form-row">
                <label>연락처</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="form-row">
                <label>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@test.com"
                />
              </div>
            </div>

            <div className="form-row">
              <label>주소</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="주소"
              />
            </div>
          </div>

          {isCompany && (
            <div className="signup-section">
              <h2>회사 정보</h2>

              <div className="signup-grid two">
                <div className="form-row">
                  <label>회사명</label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="회사명"
                  />
                </div>

                <div className="form-row">
                  <label>사업자번호</label>
                  <input
                    type="text"
                    name="businessNumber"
                    value={form.businessNumber}
                    onChange={handleChange}
                    placeholder="사업자번호"
                  />
                </div>

                <div className="form-row">
                  <label>회사 연락처</label>
                  <input
                    type="text"
                    name="companyPhone"
                    value={form.companyPhone}
                    onChange={handleChange}
                    placeholder="회사 연락처"
                  />
                </div>

                <div className="form-row">
                  <label>회사 주소</label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={form.companyAddress}
                    onChange={handleChange}
                    placeholder="회사 주소"
                  />
                </div>
              </div>
            </div>
          )}

          {isMember && (
            <div className="signup-section">
              <h2>일반 회원 추가 정보</h2>

              <div className="form-row">
                <label>선호하는 차량</label>
                <input
                  type="text"
                  name="preferredCar"
                  value={form.preferredCar}
                  onChange={handleChange}
                  placeholder="예: 현대 아반떼, SUV, 전기차 등"
                />
              </div>

              <div className="form-row">
                <label>현재 자차 보유 여부</label>

                <div className="signup-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="hasOwnCar"
                      value="N"
                      checked={form.hasOwnCar === "N"}
                      onChange={handleChange}
                    />
                    없음
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="hasOwnCar"
                      value="Y"
                      checked={form.hasOwnCar === "Y"}
                      onChange={handleChange}
                    />
                    보유중
                  </label>
                </div>
              </div>

              {form.hasOwnCar === "Y" && (
                <>
                  <ImageUploader
                    label="차량 사진"
                    images={ownCarImages}
                    setImages={setOwnCarImages}
                    multiple={true}
                    maxCount={5}
                  />

                  <div className="signup-grid four">
                    <div className="form-row">
                      <label>차량 제조사</label>
                      <input
                        type="text"
                        name="ownCarMaker"
                        value={form.ownCarMaker}
                        onChange={handleChange}
                        placeholder="현대"
                      />
                    </div>

                    <div className="form-row">
                      <label>차량 모델</label>
                      <input
                        type="text"
                        name="ownCarModel"
                        value={form.ownCarModel}
                        onChange={handleChange}
                        placeholder="아반떼"
                      />
                    </div>

                    <div className="form-row">
                      <label>미터수</label>
                      <input
                        type="number"
                        name="ownCarMileage"
                        value={form.ownCarMileage}
                        onChange={handleChange}
                        placeholder="50000"
                      />
                    </div>

                    <div className="form-row">
                      <label>연식</label>
                      <input
                        type="number"
                        name="ownCarYear"
                        value={form.ownCarYear}
                        onChange={handleChange}
                        placeholder="2021"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="signup-submit-area">
            <button type="submit" className="signup-submit-btn">
              회원가입
            </button>

            <Link to="/login" className="signup-login-link">
              이미 계정이 있으면 로그인
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default SignUpPage;
