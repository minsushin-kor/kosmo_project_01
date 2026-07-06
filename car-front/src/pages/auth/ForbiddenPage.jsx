import { Link } from "react-router-dom";
import "../../css/auth/forbiddenPage.css";

function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <section className="forbidden-box">
        <div className="forbidden-code">403 에러</div>

        <h1>접근 권한이 없음</h1>

        <p>
          권한 없는 계정(일반,회사,딜러 등 계정이 어드민 페이지 접근)
          <br />
          대충 권한없는 계정이 URL 입력으로 들어오는거 막는 페이지
        </p>

        <div className="forbidden-actions">
          <Link to="/" className="forbidden-main-btn">
            홈으로 이동
          </Link>

          <Link to="/login" className="forbidden-sub-btn">
            다른 계정으로 로그인
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ForbiddenPage;