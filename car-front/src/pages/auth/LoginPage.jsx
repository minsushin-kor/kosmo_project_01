import {
  useEffect,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  getMyProfile,
  login,
} from "../../api/authApi";
import {
  AUTH_ROLES,
  clearAuth,
  createAuthUserFromProfile,
  getAuthUser,
  getRoleHomePath,
  getRoleName,
  setAuthToken,
  setAuthUser,
} from "../../data/authUser";
import "../../css/auth/loginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams =
    new URLSearchParams(
      location.search
    );

  const isExpired =
    searchParams.get("expired") ===
    "true";

  const [loginType, setLoginType] =
    useState(AUTH_ROLES.MEMBER);

  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState(() =>
      isExpired
        ? "로그인 정보가 만료되었습니다. 다시 로그인해 주세요."
        : ""
    );

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

  async function handleLogin(e) {
    e.preventDefault();

    const trimmedLoginId =
      loginId.trim();

    if (!trimmedLoginId) {
      setErrorMessage(
        "아이디를 입력하세요."
      );

      return;
    }

    if (!password.trim()) {
      setErrorMessage(
        "비밀번호를 입력하세요."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      clearAuth();

      const loginResult =
        await login({
          loginId: trimmedLoginId,
          password,
          role: loginType,
        });

      if (
        !loginResult.token ||
        !loginResult.role
      ) {
        throw new Error(
          "로그인 응답 정보가 올바르지 않습니다."
        );
      }

      setAuthToken(
        loginResult.token
      );

      let profileResponse;

      try {
        profileResponse =
          await getMyProfile();
      } catch (profileError) {
        clearAuth();

        console.error(
          "로그인 사용자 정보 조회 실패:",
          profileError
        );

        throw new Error(
          "사용자 정보를 불러오지 못했습니다.",
          {
            cause: profileError,
          }
        );
      }

      const loginUser =
        createAuthUserFromProfile({
          loginResult,
          profileResponse,
          loginId: trimmedLoginId,
        });

      setAuthUser(loginUser);

      navigate(
        getRoleHomePath(
          loginUser.role
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      clearAuth();

      console.error(
        "로그인 실패:",
        error
      );

      setErrorMessage(
        error.message ||
        "로그인에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-box">
        <div className="login-header">
          <h1>로그인</h1>

          <p>
            계정 유형을 선택하고
            로그인 정보를 입력하세요.
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
              disabled={isSubmitting}
              onClick={() => {
                setLoginType(
                  AUTH_ROLES.MEMBER
                );

                setErrorMessage("");
              }}
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
              disabled={isSubmitting}
              onClick={() => {
                setLoginType(
                  AUTH_ROLES.COMPANY
                );

                setErrorMessage("");
              }}
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
              disabled={isSubmitting}
              onClick={() => {
                setLoginType(
                  AUTH_ROLES.DEALER
                );

                setErrorMessage("");
              }}
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
              disabled={isSubmitting}
              onClick={() => {
                setLoginType(
                  AUTH_ROLES.ADMIN
                );

                setErrorMessage("");
              }}
            >
              {getRoleName(
                AUTH_ROLES.ADMIN
              )}
            </button>
          </div>

          <div className="form-row">
            <label htmlFor="login-id">
              아이디
            </label>

            <input
              id="login-id"
              type="text"
              value={loginId}
              disabled={isSubmitting}
              autoComplete="username"
              onChange={(e) => {
                setLoginId(
                  e.target.value
                );

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              placeholder="로그인 아이디를 입력하세요"
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">
              비밀번호
            </label>

            <input
              id="password"
              type="password"
              value={password}
              disabled={isSubmitting}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(
                  e.target.value
                );

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="login-error-message"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "로그인 중..."
              : "로그인"}
          </button>
        </form>

        <div className="login-guide">
          <p>
            회원가입 또는 계정 생성 시 등록한 로그인 아이디로 로그인
          </p>

          <p>
            계정 유형을 정확하게 선택한 뒤 로그인하세요.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;