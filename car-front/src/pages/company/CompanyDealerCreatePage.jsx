import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/common/PageTitle";
import ImageUploader from "../../components/common/ImageUploader";
import { saveCompanyDealerToStorage } from "../../utils/companyDealerStorage";
import { readImageFileAsDataUrl } from "../../utils/imageFileReader";
import "../../css/common/page.css";
import "../../css/company/companyDealerCreatePage.css";

function CompanyDealerCreatePage() {
  const navigate = useNavigate();
  const [dealerImages, setDealerImages] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    loginId: "",
    password: "",
    passwordCheck: "",
    phone: "",
    email: "",
    memo: "",
  });

  const handleChangeForm = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitDealer = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("딜러명을 입력해주세요.");
      return;
    }

    if (!formData.loginId.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }

    if (!formData.password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    if (formData.password !== formData.passwordCheck) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    if (!formData.email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const dealerImageFile = dealerImages[0]?.file;
    const dealerImageUrl = await readImageFileAsDataUrl(dealerImageFile);

    const newDealer = {
      id: Date.now(),
      name: formData.name,
      loginId: formData.loginId,
      phone: formData.phone,
      email: formData.email,
      memo: formData.memo,
      carCount: 0,
      soldCount: 0,
      status: "정상",
      joinDate: new Date().toISOString().slice(0, 10),
      imageName: dealerImageFile?.name || "",
      imagePreviewUrl: dealerImageUrl,
    };

    saveCompanyDealerToStorage(newDealer);

    alert("딜러 계정이 생성되었습니다.");

    navigate("/company/dealers");
  };

  const handleCancel = () => {
    navigate("/company/dealers");
  };

  return (
    <main className="page-container">
      <PageTitle
        title="딜러 계정 생성"
        description="회사 소속으로 사용할 딜러 계정을 생성합니다."
      />

      <section className="dealer-create-panel">
        <form className="dealer-create-form" onSubmit={handleSubmitDealer}>
          <div className="dealer-create-section">
            <h3>기본 정보</h3>

            <div className="dealer-form-grid">
              <div className="dealer-form-group">
                <label htmlFor="name">딜러명</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChangeForm}
                  placeholder="딜러명을 입력하세요"
                />
              </div>

              <div className="dealer-form-group">
                <label htmlFor="loginId">아이디</label>
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  value={formData.loginId}
                  onChange={handleChangeForm}
                  placeholder="로그인 아이디"
                />
              </div>

              <div className="dealer-form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChangeForm}
                  placeholder="비밀번호"
                />
              </div>

              <div className="dealer-form-group">
                <label htmlFor="passwordCheck">비밀번호 확인</label>
                <input
                  id="passwordCheck"
                  name="passwordCheck"
                  type="password"
                  value={formData.passwordCheck}
                  onChange={handleChangeForm}
                  placeholder="비밀번호 확인"
                />
              </div>

              <div className="dealer-form-group">
                <label htmlFor="phone">연락처</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChangeForm}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="dealer-form-group">
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChangeForm}
                  placeholder="dealer@company.com"
                />
              </div>
            </div>
          </div>

          <div className="dealer-create-section">
            <h3>딜러 이미지</h3>

            <ImageUploader
              label="딜러 프로필 이미지"
              images={dealerImages}
              setImages={setDealerImages}
              multiple={false}
              maxCount={1}
            />
          </div>

          <div className="dealer-create-section">
            <h3>메모</h3>

            <div className="dealer-form-group">
              <label htmlFor="memo">관리 메모</label>
              <textarea
                id="memo"
                name="memo"
                value={formData.memo}
                onChange={handleChangeForm}
                placeholder="딜러 계정 관련 메모를 입력하세요"
              />
            </div>
          </div>

          <div className="dealer-create-guide">
            <strong>안내</strong>
            <p>
              현재는 프론트 화면 확인용입니다. 나중에 백엔드 연결 시 회사 번호,
              딜러 권한, 초기 상태값, 프로필 이미지를 같이 전송하면 됩니다.
            </p>
          </div>

          <div className="dealer-create-btn-area">
            <button
              type="button"
              className="dealer-cancel-btn"
              onClick={handleCancel}
            >
              취소
            </button>

            <button type="submit" className="dealer-submit-btn">
              딜러 계정 생성
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CompanyDealerCreatePage;