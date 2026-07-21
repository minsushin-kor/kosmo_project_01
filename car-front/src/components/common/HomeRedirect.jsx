import {
  Navigate,
} from "react-router-dom";
import {
  AUTH_ROLES,
} from "../../data/authUser";
import {
  useAuth,
} from "../../hooks/useAuth";
import IndexPage from "../../pages/home/IndexPage";

function HomeRedirect() {
  const {
    loginUser,
  } = useAuth();

  if (
    loginUser?.role ===
    AUTH_ROLES.COMPANY
  ) {
    return (
      <Navigate
        to="/company/mypage"
        replace
      />
    );
  }

  return <IndexPage />;
}

export default HomeRedirect;