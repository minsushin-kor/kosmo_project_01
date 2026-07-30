import { useEffect, useState } from "react";
import { getAuthUser, removeAuthUser } from "../data/authUser";
import { clearWishlistCache } from "../api/wishlistApi";

function useAuth() {
  const [loginUser, setLoginUser] = useState(getAuthUser());

  const isLogin = loginUser !== null;

  const refreshAuthUser = () => {
    clearWishlistCache();
    setLoginUser(getAuthUser());
  };

  const logout = () => {
    clearWishlistCache();
    removeAuthUser();
    setLoginUser(null);
  };

  useEffect(() => {
    const handleAuthChange = () => {
      refreshAuthUser();
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  return {
    loginUser,
    isLogin,
    refreshAuthUser,
    logout,
  };
}

export { useAuth };
export default useAuth;