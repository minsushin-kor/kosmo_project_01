export const AUTH_STORAGE_KEY = "car_front_auth_user";

export const AUTH_ROLES = {
  ADMIN: "ADMIN",
  COMPANY: "COMPANY",
  DEALER: "DEALER",
  MEMBER: "MEMBER",
};

export const ROLE_NAME_MAP = {
  ADMIN: "관리자",
  COMPANY: "회사",
  DEALER: "딜러",
  MEMBER: "일반회원",
};

export const ROLE_HOME_PATH_MAP = {
  ADMIN: "/admin",
  COMPANY: "/company",
  DEALER: "/dealer",
  MEMBER: "/member",
};

export function getRoleName(role) {
  return ROLE_NAME_MAP[role] || "알 수 없음";
}

export function getRoleHomePath(role) {
  return ROLE_HOME_PATH_MAP[role] || "/";
}

export function createTempUser(role) {
  const roleName = getRoleName(role);

  return {
    isLogin: true,
    id: Date.now(),
    loginId: role.toLowerCase(),
    name: roleName,
    role,
    email: `${role.toLowerCase()}@test.com`,
    phone: "010-0000-0000",
    notificationCount: role === AUTH_ROLES.ADMIN ? 3 : 1,
  };
}

export function getAuthUser() {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setAuthUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
}

export function removeAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("auth-change"));
}