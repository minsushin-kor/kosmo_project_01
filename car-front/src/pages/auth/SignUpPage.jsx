import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageUploader from "../../components/common/ImageUploader";
import {
  signupCompany,
  signupMember,
} from "../../api/authApi";
import "../../css/auth/signUpPage.css";
import {
  uploadImage,
} from "../../api/imageApi";

const SIGNUP_TYPES = {
  COMPANY: "COMPANY",
  MEMBER: "MEMBER",
};

const SIGNUP_TYPE_LABEL = {
  COMPANY: "기업",
  MEMBER: "일반회원",
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

  preferredCar: "",
  hasOwnCar: "N",
  ownCarMaker: "",
  ownCarModel: "",
  ownCarMileage: "",
  ownCarYear: "",
};

function SignUpPage() {
  const navigate = useNavigate();

  const [signupType, setSignupType] = useState(
    SIGNUP_TYPES.COMPANY
  );

  const [profileImages, setProfileImages] = useState([]);
  const [ownCarImages, setOwnCarImages] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isMember =
    signupType === SIGNUP_TYPES.MEMBER;

  const isCompany =
    signupType === SIGNUP_TYPES.COMPANY;

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setErrorMessage("");

    if (
      name === "hasOwnCar" &&
      value === "N"
    ) {
      setOwnCarImages([]);

      setForm((prev) => ({
        ...prev,
        hasOwnCar: "N",
        ownCarMaker: "",
        ownCarModel: "",
        ownCarMileage: "",
        ownCarYear: "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSignupTypeChange(type) {
    if (isSubmitting) {
      return;
    }

    setSignupType(type);
    setProfileImages([]);
    setOwnCarImages([]);
    setErrorMessage("");

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

    if (!form.passwordCheck.trim()) {
      alert("비밀번호 확인을 입력하세요.");
      return false;
    }

    if (
      form.password !==
      form.passwordCheck
    ) {
      alert("비밀번호 확인이 맞지 않습니다.");
      return false;
    }

    if (isMember) {
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
    }

    if (isCompany) {
      if (!form.email.trim()) {
        alert("대표 이메일을 입력하세요.");
        return false;
      }

      if (!form.companyName.trim()) {
        alert("회사명을 입력하세요.");
        return false;
      }

      if (!form.businessNumber.trim()) {
        alert("사업자번호를 입력하세요.");
        return false;
      }

      if (!form.phone.trim()) {
        alert("회사 연락처를 입력하세요.");
        return false;
      }

      if (!form.address.trim()) {
        alert("회사 주소를 입력하세요.");
        return false;
      }
    }

    if (
      isMember &&
      form.hasOwnCar === "Y"
    ) {
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

      const mileage = Number(
        form.ownCarMileage
      );

      const year = Number(
        form.ownCarYear
      );

      const currentYear =
        new Date().getFullYear();

      if (
        Number.isNaN(mileage) ||
        mileage < 0
      ) {
        alert("미터수를 올바르게 입력하세요.");
        return false;
      }

      if (
        Number.isNaN(year) ||
        year < 1900 ||
        year > currentYear + 1
      ) {
        alert("연식을 올바르게 입력하세요.");
        return false;
      }
    }

    return true;
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
      setErrorMessage("");

      let profileImageUrl = "";

      /*
       * 프로필 사진이 선택된 경우
       * 회원가입 전에 이미지부터 업로드합니다.
       */
      if (profileImages[0]?.file) {
        const uploadedImage =
          await uploadImage(
            profileImages[0].file,
            isCompany
              ? "company"
              : "member"
          );

        profileImageUrl =
          uploadedImage?.imageUrl || "";

        if (!profileImageUrl) {
          throw new Error(
            "프로필 이미지 주소를 받지 못했습니다."
          );
        }
      }

      if (isMember) {
        let ownedCarImageUrl = "";

        /*
         * 자차 사진은 현재 DB 구조가 URL 하나만 받으므로
         * 첫 번째 사진만 저장합니다.
         */
        if (
          form.hasOwnCar === "Y" &&
          ownCarImages[0]?.file
        ) {
          const uploadedCarImage =
            await uploadImage(
              ownCarImages[0].file,
              "car"
            );

          ownedCarImageUrl =
            uploadedCarImage?.imageUrl ||
            "";
        }

        await signupMember({
          loginId:
            form.loginId.trim(),

          email:
            form.email.trim(),

          password:
            form.password,

          name:
            form.name.trim(),

          phone:
            form.phone.trim(),

          profileImageUrl,

          hasCar:
            form.hasOwnCar === "Y",

          ownedCarImageUrl,

          ownedCarMake:
            form.hasOwnCar === "Y"
              ? form.ownCarMaker.trim()
              : "",

          ownedCarModel:
            form.hasOwnCar === "Y"
              ? form.ownCarModel.trim()
              : "",

          ownedCarOdometer:
            form.hasOwnCar === "Y"
              ? Number(
                form.ownCarMileage
              )
              : null,

          ownedCarYear:
            form.hasOwnCar === "Y"
              ? Number(
                form.ownCarYear
              )
              : null,
        });
      }

      if (isCompany) {
        await signupCompany({
          loginId:
            form.loginId.trim(),

          businessNumber:
            form.businessNumber.trim(),

          name:
            form.companyName.trim(),

          masterEmail:
            form.email.trim(),

          password:
            form.password,

          address:
            form.address.trim(),

          phone:
            form.phone.trim(),

          profileImageUrl,
        });
      }

      alert("회원가입이 완료되었습니다.");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "회원가입 실패:",
        error
      );

      setErrorMessage(
        error?.message ||
        "회원가입 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-box">
        <div className="signup-header">
          <h1>회원가입</h1>

          <p>
            회사계정, 일반회원 가입 폼
          </p>
        </div>

        <div className="signup-type-group">
          {Object.values(
            SIGNUP_TYPES
          ).map((type) => (
            <button
              key={type}
              type="button"
              disabled={isSubmitting}
              className={
                signupType === type
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleSignupTypeChange(
                  type
                )
              }
            >
              {
                SIGNUP_TYPE_LABEL[
                type
                ]
              }
            </button>
          ))}
        </div>

        {errorMessage && (
          <p className="signup-error-message">
            {errorMessage}
          </p>
        )}

        <form
          className="signup-form"
          onSubmit={handleSubmit}
        >
          <div className="signup-section">
            <h2>기본 정보</h2>

            <ImageUploader
              label={
                isCompany
                  ? "회사 프로필 사진"
                  : "프로필 사진"
              }
              images={profileImages}
              setImages={setProfileImages}
              multiple={false}
              maxCount={1}
            />

            <div className="signup-grid two">
              <div className="form-row">
                <label htmlFor="signup-login-id">
                  아이디
                </label>

                <input
                  id="signup-login-id"
                  type="text"
                  name="loginId"
                  value={form.loginId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="아이디"
                  autoComplete="username"
                />
              </div>

              {isMember && (
                <div className="form-row">
                  <label htmlFor="signup-name">
                    이름
                  </label>

                  <input
                    id="signup-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    disabled={
                      isSubmitting
                    }
                    placeholder="이름"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="form-row">
                <label htmlFor="signup-password">
                  비밀번호
                </label>

                <input
                  id="signup-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="비밀번호"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-row">
                <label htmlFor="signup-password-check">
                  비밀번호 확인
                </label>

                <input
                  id="signup-password-check"
                  type="password"
                  name="passwordCheck"
                  value={
                    form.passwordCheck
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                />
              </div>

              {isMember && (
                <div className="form-row">
                  <label htmlFor="signup-phone">
                    연락처
                  </label>

                  <input
                    id="signup-phone"
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="010-0000-0000"
                    autoComplete="tel"
                  />
                </div>
              )}

              <div className="form-row">
                <label htmlFor="signup-email">
                  {isCompany
                    ? "대표 이메일"
                    : "이메일"}
                </label>

                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder={
                    isCompany
                      ? "company@test.com"
                      : "email@test.com"
                  }
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {isCompany && (
            <div className="signup-section">
              <h2>회사 정보</h2>

              <div className="signup-grid two">
                <div className="form-row">
                  <label htmlFor="signup-company-name">
                    회사명
                  </label>

                  <input
                    id="signup-company-name"
                    type="text"
                    name="companyName"
                    value={
                      form.companyName
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      isSubmitting
                    }
                    placeholder="회사명"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="signup-business-number">
                    사업자번호
                  </label>

                  <input
                    id="signup-business-number"
                    type="text"
                    name="businessNumber"
                    value={
                      form.businessNumber
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      isSubmitting
                    }
                    placeholder="123-45-67890"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="signup-company-phone">
                    회사 연락처
                  </label>

                  <input
                    id="signup-company-phone"
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="02-0000-0000"
                    autoComplete="tel"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="signup-company-address">
                    회사 주소
                  </label>

                  <input
                    id="signup-company-address"
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="회사 주소"
                    autoComplete="street-address"
                  />
                </div>
              </div>
            </div>
          )}

          {isMember && (
            <div className="signup-section">
              <h2>
                일반 회원 추가 정보
              </h2>

              <div className="form-row">
                <label htmlFor="signup-preferred-car">
                  선호하는 차량
                </label>

                <input
                  id="signup-preferred-car"
                  type="text"
                  name="preferredCar"
                  value={
                    form.preferredCar
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSubmitting
                  }
                  placeholder="예: 현대 아반떼, SUV, 전기차 등"
                />
              </div>

              <div className="form-row">
                <span className="signup-form-label">
                  현재 자차 보유 여부
                </span>

                <div className="signup-radio-group">
                  <label>
                    <input
                      type="radio"
                      name="hasOwnCar"
                      value="N"
                      checked={
                        form.hasOwnCar ===
                        "N"
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />
                    없음
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="hasOwnCar"
                      value="Y"
                      checked={
                        form.hasOwnCar ===
                        "Y"
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                    />
                    보유중
                  </label>
                </div>
              </div>

              {form.hasOwnCar ===
                "Y" && (
                  <>
                    <ImageUploader
                      label="차량 사진"
                      images={
                        ownCarImages
                      }
                      setImages={
                        setOwnCarImages
                      }
                      multiple={true}
                      maxCount={5}
                    />

                    <div className="signup-grid four">
                      <div className="form-row">
                        <label htmlFor="signup-own-car-maker">
                          차량 제조사
                        </label>

                        <input
                          id="signup-own-car-maker"
                          type="text"
                          name="ownCarMaker"
                          value={
                            form.ownCarMaker
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            isSubmitting
                          }
                          placeholder="현대"
                        />
                      </div>

                      <div className="form-row">
                        <label htmlFor="signup-own-car-model">
                          차량 모델
                        </label>

                        <input
                          id="signup-own-car-model"
                          type="text"
                          name="ownCarModel"
                          value={
                            form.ownCarModel
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            isSubmitting
                          }
                          placeholder="아반떼"
                        />
                      </div>

                      <div className="form-row">
                        <label htmlFor="signup-own-car-mileage">
                          미터수
                        </label>

                        <input
                          id="signup-own-car-mileage"
                          type="number"
                          name="ownCarMileage"
                          min="0"
                          value={
                            form.ownCarMileage
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            isSubmitting
                          }
                          placeholder="50000"
                        />
                      </div>

                      <div className="form-row">
                        <label htmlFor="signup-own-car-year">
                          연식
                        </label>

                        <input
                          id="signup-own-car-year"
                          type="number"
                          name="ownCarYear"
                          min="1900"
                          max={
                            new Date().getFullYear() +
                            1
                          }
                          value={
                            form.ownCarYear
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            isSubmitting
                          }
                          placeholder="2021"
                        />
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}

          <div className="signup-submit-area">
            <button
              type="submit"
              className="signup-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "회원가입 처리중..."
                : "회원가입"}
            </button>

            <Link
              to="/login"
              className="signup-login-link"
              aria-disabled={
                isSubmitting
              }
              onClick={(e) => {
                if (isSubmitting) {
                  e.preventDefault();
                }
              }}
            >
              이미 계정이 있으면 로그인
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default SignUpPage;