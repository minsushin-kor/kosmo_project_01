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
  COMPANY: "/company/mypage",
  DEALER: "/",
  MEMBER: "/",
};

export function getRoleName(role) {
  return ROLE_NAME_MAP[role] || "알 수 없음";
}

export function getRoleHomePath(role) {
  return ROLE_HOME_PATH_MAP[role] || "/";
}

export function createTempUser(role) {
  const roleName = getRoleName(role);

  const TEMP_USER_ID_MAP = {
    ADMIN: 1,
    COMPANY: 2,
    DEALER: 3,
    MEMBER: 4,
  };

  const isMember =
    role === AUTH_ROLES.MEMBER;

  const isCompany =
    role === AUTH_ROLES.COMPANY;

  const isDealer =
    role === AUTH_ROLES.DEALER;

  return {
    isLogin: true,
    id: TEMP_USER_ID_MAP[role] || 999,

    dealerId: isDealer
      ? TEMP_USER_ID_MAP.DEALER
      : null,

    companyId:
      isCompany || isDealer
        ? 1
        : null,

    loginId: role.toLowerCase(),

    name: isCompany
      ? "Kosmo 인증모터스"
      : isDealer
        ? "박딜러"
        : roleName,

    companyName:
      isCompany || isDealer
        ? "Kosmo 인증모터스"
        : "",

    role,
    email: `${role.toLowerCase()}@test.com`,
    phone: "010-0000-0000",

    businessNumber: isCompany
      ? "000-00-00000"
      : "",

    notificationCount:
      role === AUTH_ROLES.ADMIN
        ? 3
        : 1,

    couponCount: isCompany
      ? 3
      : 0,

    preferredCar: isMember
      ? "현대 아반떼 SUV 가솔린"
      : "",

    ownedCars: isMember
      ? [
          {
            id: 1,
            brand: "현대",
            modelName: "아반떼 CN7",
            carName: "현대 아반떼 CN7",
            year: 2021,
            mileage: 42000,
            carNumber: "123가 4567",
            fuel: "가솔린",
            transmission: "자동",
            color: "화이트",
            imageUrl:
              "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
          },
        ]
      : [],
  };
}

export function getAuthUser() {
  const savedUser = localStorage.getItem(
    AUTH_STORAGE_KEY
  );

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error(
      "로그인 사용자 정보 불러오기 실패:",
      error
    );

    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    return null;
  }
}

export function setAuthUser(user) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(user)
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}

export function removeAuthUser() {
  localStorage.removeItem(
    AUTH_STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}