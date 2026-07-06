import { Link } from "react-router-dom";
import "../../css/auth/notFoundPage.css";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section className="not-found-box">
        <div className="not-found-code">404 에러</div>

        <h1>페이지를 찾을 수 없음</h1>

        <p>
          없는 주소로 들어왔을 때 보여주는 페이지
          <br />
          URL을 잘못 입력했거나 아직 안 만든 페이지일 수 있음
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-main-btn">
            홈으로 이동
          </Link>

          <Link to="/login" className="not-found-sub-btn">
            로그인 페이지로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;