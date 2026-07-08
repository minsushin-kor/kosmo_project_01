import { Link, useNavigate } from "react-router-dom";
import { getHeaderMenus } from "../../data/menuData";
import { AUTH_ROLES } from "../../data/authUser";
import { useAuth } from "../../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";
import MessageDropdown from "../message/MessageDropdown";
import "../../css/common/header.css";

function Header() {
  const navigate = useNavigate();

  const { loginUser, isLogin, logout } = useAuth();

  const menus = getHeaderMenus(loginUser?.role);

  const isCompany = loginUser?.role === AUTH_ROLES.COMPANY;

  const myPagePath = isCompany ? "/company/mypage" : "/mypage";
  const myPageName = isCompany ? "회사관리" : "마이페이지";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <Link to="/">이름뭐라짓지</Link>
        </div>

        <nav className="nav">
          {menus.map((menu) => (
            <Link key={menu.id} to={menu.path}>
              {menu.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-right">
        {!isLogin ? (
          <>
            <Link to="/signup" className="mypage-link">
              회원가입
            </Link>

            <Link to="/login" className="login-btn">
              로그인
            </Link>
          </>
        ) : (
          <>
            <NotificationDropdown loginUser={loginUser} />

            <MessageDropdown />

            <Link to={myPagePath} className="mypage-link">
              {myPageName}
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