import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  getHeaderMenus,
} from "../../data/menuData";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import {
  prefetchRoute,
} from "../../data/routeLoaders";
import {
  useAuth,
} from "../../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";
import MessageDropdown from "../message/MessageDropdown";
import "../../css/common/header.css";

function getPrefetchHandlers(path) {
  return {
    onMouseEnter: () =>
      prefetchRoute(path),

    onFocus: () =>
      prefetchRoute(path),

    onTouchStart: () =>
      prefetchRoute(path),
  };
}

function Header() {
  const navigate = useNavigate();

  const {
    loginUser,
    isLogin,
    logout,
  } = useAuth();

  const isCompany =
    loginUser?.role ===
    AUTH_ROLES.COMPANY;

  const isDealer =
    loginUser?.role ===
    AUTH_ROLES.DEALER;

  const menus =
    getHeaderMenus(loginUser?.role);

  const logoPath = isCompany
    ? "/company/mypage"
    : "/";

  const companyName =
    loginUser?.companyName ||
    "Kosmo 인증모터스";

  const dealerName =
    loginUser?.name ||
    "딜러";

  function handleLogout() {
    logout();

    navigate("/", {
      replace: true,
    });
  }

  return (
    <header
      className={`header ${
        isCompany
          ? "company-header"
          : ""
      }`}
    >
      <div className="header-left">
        <div className="logo">
          <Link
            to={logoPath}
            {...getPrefetchHandlers(
              logoPath
            )}
          >
            Kosmo Car
          </Link>
        </div>

        <nav className="nav">
          {menus.map((menu) => (
            <Link
              key={menu.id}
              to={menu.path}
              {...getPrefetchHandlers(
                menu.path
              )}
            >
              {menu.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-right">
        {!isLogin ? (
          <>
            <Link
              to="/signup"
              className="mypage-link"
              {...getPrefetchHandlers(
                "/signup"
              )}
            >
              회원가입
            </Link>

            <Link
              to="/login"
              className="login-btn"
              {...getPrefetchHandlers(
                "/login"
              )}
            >
              로그인
            </Link>
          </>
        ) : isCompany ? (
          <>
            <Link
              to="/company/coupons"
              className="header-coupon-link"
              {...getPrefetchHandlers(
                "/company/coupons"
              )}
            >
              쿠폰함

              {Number(
                loginUser?.couponCount || 0
              ) > 0 && (
                <span className="header-count-badge">
                  {loginUser.couponCount}
                </span>
              )}
            </Link>

            <NotificationDropdown
              loginUser={loginUser}
            />

            <Link
              to="/company/mypage"
              className="company-name-link"
              {...getPrefetchHandlers(
                "/company/mypage"
              )}
            >
              {companyName}
            </Link>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </>
        ) : isDealer ? (
          <>
            <div className="dealer-account-links">
              <Link
                to="/company"
                className="dealer-company-link"
                {...getPrefetchHandlers(
                  "/company"
                )}
              >
                {companyName}
              </Link>

              <Link
                to="/dealer"
                className="dealer-name-link"
                {...getPrefetchHandlers(
                  "/dealer"
                )}
              >
                {dealerName}
              </Link>
            </div>

            <NotificationDropdown
              loginUser={loginUser}
            />

            <MessageDropdown />

            <Link
              to="/dealer"
              className="mypage-link"
              {...getPrefetchHandlers(
                "/dealer"
              )}
            >
              마이페이지
            </Link>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <NotificationDropdown
              loginUser={loginUser}
            />

            <MessageDropdown />

            <Link
              to="/mypage"
              className="mypage-link"
              {...getPrefetchHandlers(
                "/mypage"
              )}
            >
              마이페이지
            </Link>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;