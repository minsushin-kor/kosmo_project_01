import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
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

  const [loginType, setLoginType] =
    useState(AUTH_ROLES.MEMBER);

  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
    useState("");

  useEffect(() => {
    const loginUser = getAuthUser();

    if (!loginUser?.isLogin) {
      return;
    }

    navigate(
      getRoleHomePath(loginUser.role),
      {
        replace: true,
      }
    );
  }, [navigate]);

  function handleLogin(e) {
    e.preventDefault();

    if (!loginId.trim()) {
      alert("아이디를 입력하세요.");
      return;
    }

    if (!password.trim()) {
      alert("비밀번호를 입력하세요.");
      return;
    }

    const tempUser =
      createTempUser(loginType);

    const loginUser = {
      ...tempUser,
      isLogin: true,
      loginId: loginId.trim(),
    };

    setAuthUser(loginUser);

    navigate(
      getRoleHomePath(loginUser.role),
      {
        replace: true,
      }
    );
  }

  return (
    <main className="login-page">
      <section className="login-box">
        <div className="login-header">
          <h1>로그인</h1>

          <p>
            계정 유형을 선택하고 로그인하면
            해당 권한 계정으로 로그인되고
            아이디 비번은 아무거나 입력해도
            로그인 가능
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-type-group">
            <button
              type="button"
              className={
                loginType ===
                AUTH_ROLES.MEMBER
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLoginType(
                  AUTH_ROLES.MEMBER
                )
              }
            >
              {getRoleName(
                AUTH_ROLES.MEMBER
              )}
            </button>

            <button
              type="button"
              className={
                loginType ===
                AUTH_ROLES.COMPANY
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLoginType(
                  AUTH_ROLES.COMPANY
                )
              }
            >
              {getRoleName(
                AUTH_ROLES.COMPANY
              )}
            </button>

            <button
              type="button"
              className={
                loginType ===
                AUTH_ROLES.DEALER
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLoginType(
                  AUTH_ROLES.DEALER
                )
              }
            >
              {getRoleName(
                AUTH_ROLES.DEALER
              )}
            </button>

            <button
              type="button"
              className={
                loginType ===
                AUTH_ROLES.ADMIN
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLoginType(
                  AUTH_ROLES.ADMIN
                )
              }
            >
              {getRoleName(
                AUTH_ROLES.ADMIN
              )}
            </button>
          </div>

          <div className="form-row">
            <label>아이디</label>

            <input
              type="text"
              value={loginId}
              onChange={(e) =>
                setLoginId(e.target.value)
              }
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="form-row">
            <label>비밀번호</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
          >
            로그인
          </button>
        </form>

        <div className="login-guide">
          <p>
            현재는 화면 이동 확인용 임시 로그인
          </p>

          <p>
            선택한 계정 유형에 따라 탑바 메뉴
            변경
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;