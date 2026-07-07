import { Link } from "react-router-dom";
import { getRoleName } from "../../data/authUser";
import { getMyPageMenusByRole } from "../../data/myPageMenuData";
import { useAuth } from "../../hooks/useAuth";
import "../../css/member/myPage.css";

function MyPage() {
  const { loginUser } = useAuth();

  if (!loginUser) {
    return (
      <main className="mypage">
        <section className="mypage-header">
          <div>
            <h1>마이페이지</h1>
            <p>로그인이 필요한 페이지입니다.</p>
          </div>

          <Link to="/login" className="mypage-home-btn">
            로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  const myPageMenus = getMyPageMenusByRole(loginUser.role);

  return (
    <main className="mypage">
      <section className="mypage-header">
        <div>
          <h1>마이페이지</h1>
          <p>로그인한 사용자의 기본 정보출력 페이지</p>
        </div>

        <Link to="/" className="mypage-home-btn">
          홈으로 이동
        </Link>
      </section>

      <section className="mypage-content">
        <div className="profile-card">
          <div className="profile-icon">
            {getRoleName(loginUser.role).charAt(0)}
          </div>

          <div className="profile-info">
            <h2>{loginUser.name}</h2>
            <p>{getRoleName(loginUser.role)}</p>
          </div>
        </div>

        <div className="info-card">
          <h3>계정 정보</h3>

          <div className="info-row">
            <span>아이디</span>
            <strong>{loginUser.loginId}</strong>
          </div>

          <div className="info-row">
            <span>이름</span>
            <strong>{loginUser.name}</strong>
          </div>

          <div className="info-row">
            <span>권한</span>
            <strong>{getRoleName(loginUser.role)}</strong>
          </div>

          <div className="info-row">
            <span>이메일</span>
            <strong>{loginUser.email}</strong>
          </div>

          <div className="info-row">
            <span>연락처</span>
            <strong>{loginUser.phone}</strong>
          </div>
        </div>

        <div className="mypage-menu-card">
          <h3>바로가기</h3>

          <div className="mypage-menu-list">
            {myPageMenus.length === 0 ? (
              <p className="mypage-menu-empty">
                이 계정은 아직 바로가기 메뉴가 없음
              </p>
            ) : (
              myPageMenus.map((menu) => (
                <Link key={menu.id} to={menu.path}>
                  {menu.name}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default MyPage;