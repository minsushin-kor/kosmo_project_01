import { Link, useNavigate } from "react-router-dom";
import { getHeaderMenus } from "../../data/menuData";
import { useAuth } from "../../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";
import "../../css/common/header.css";

function Header() {
  const navigate = useNavigate();

  const { loginUser, isLogin, logout } = useAuth();

  const menus = getHeaderMenus(loginUser?.role);

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
          <Link to="/login" className="login-btn">
            로그인
          </Link>
        ) : (
          <>
            <NotificationDropdown loginUser={loginUser} />

            <Link to="/mypage" className="mypage-link">
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