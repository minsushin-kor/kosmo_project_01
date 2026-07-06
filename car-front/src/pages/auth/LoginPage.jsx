import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_ROLES,
  createTempUser,
  getAuthUser,
  getRoleHomePath,
  getRoleName,
  setAuthUser,
} from "../../data/authUser";
import "../../css/auth/loginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginType, setLoginType] = useState(AUTH_ROLES.MEMBER);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  /*
    ProtectedRoute에서 /login으로 보낼 때 넣어준 원래 가려던 주소
    예: /admin, /dealer/cars, /mypage 등
  */
  const redirectPath = location.state?.from;

  /*
    이미 로그인한 상태에서 /login으로 들어오면
    로그인 페이지 보여주지 않고 권한별 메인 페이지로 이동
  */
  useEffect(() => {
    const loginUser = getAuthUser();

    if (loginUser) {
      navigate(getRoleHomePath(loginUser.role), { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!loginId.trim()) {
      alert("아이디를 입력하세요.");
      return;
    }

    if (!password.trim()) {
      alert("비밀번호를 입력하세요.");
      return;
    }

    const tempUser = createTempUser(loginType);

    setAuthUser({
      ...tempUser,
      loginId,
    });

    /*
      원래 가려던 주소가 있으면 그쪽으로 이동
      없으면 선택한 권한의 기본 페이지로 이동
    */
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }

    navigate(getRoleHomePath(loginType), { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-box">
        <div className="login-header">
          <h1>로그인</h1>
          <p>계정 유형을 선택하고 로그인하세요.</p>
        </div>

        {redirectPath && (
          <div className="login-redirect-guide">
            <p>로그인 후 원래 들어가려던 페이지로 이동함</p>
            <strong>{redirectPath}</strong>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-type-group">
            <button
              type="button"
              className={loginType === AUTH_ROLES.MEMBER ? "active" : ""}
              onClick={() => setLoginType(AUTH_ROLES.MEMBER)}
            >
              {getRoleName(AUTH_ROLES.MEMBER)}
            </button>

            <button
              type="button"
              className={loginType === AUTH_ROLES.COMPANY ? "active" : ""}
              onClick={() => setLoginType(AUTH_ROLES.COMPANY)}
            >
              {getRoleName(AUTH_ROLES.COMPANY)}
            </button>

            <button
              type="button"
              className={loginType === AUTH_ROLES.DEALER ? "active" : ""}
              onClick={() => setLoginType(AUTH_ROLES.DEALER)}
            >
              {getRoleName(AUTH_ROLES.DEALER)}
            </button>

            <button
              type="button"
              className={loginType === AUTH_ROLES.ADMIN ? "active" : ""}
              onClick={() => setLoginType(AUTH_ROLES.ADMIN)}
            >
              {getRoleName(AUTH_ROLES.ADMIN)}
            </button>
          </div>

          <div className="form-row">
            <label>아이디</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="form-row">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button type="submit" className="login-submit-btn">
            로그인
          </button>
        </form>

        <div className="login-guide">
          <p>현재는 화면 이동 확인용 임시 로그인입니다.</p>
          <p>선택한 계정 유형에 따라 탑바 메뉴가 변경됩니다.</p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;