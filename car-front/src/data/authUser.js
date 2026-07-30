export const AUTH_STORAGE_KEY =
  "car_front_auth_user";

export const AUTH_TOKEN_STORAGE_KEY =
  "car_front_access_token";

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
  DEALER: "/dealer",
  MEMBER: "/",
};

export function getRoleName(role) {
  return (
    ROLE_NAME_MAP[role] ||
    "알 수 없음"
  );
}

export function getRoleHomePath(role) {
  return (
    ROLE_HOME_PATH_MAP[role] ||
    "/"
  );
}

/**
 * 아직 실제 API가 연결되지 않은 화면에서만 사용하는 임시 사용자입니다.
 * 실제 로그인에서는 createAuthUserFromProfile()을 사용합니다.
 */
export function createTempUser(role) {
  const roleName =
    getRoleName(role);

  const TEMP_USER_ID_MAP = {
    ADMIN: 1,
    COMPANY: 2,
    DEALER: 3,
    MEMBER: 4,
  };

  const isAdmin =
    role === AUTH_ROLES.ADMIN;

  const isMember =
    role === AUTH_ROLES.MEMBER;

  const isCompany =
    role === AUTH_ROLES.COMPANY;

  const isDealer =
    role === AUTH_ROLES.DEALER;

  const tempId =
    TEMP_USER_ID_MAP[role] ||
    999;

  return {
    isLogin: true,

    // 기존 프론트 기능에서 공통으로 사용하는 ID
    id: tempId,

    // 통합 users 테이블 ID
    userId: tempId,

    // 역할별 상세 테이블 ID
    memberId:
      isMember || isAdmin
        ? tempId
        : null,

    companyId:
      isCompany || isDealer
        ? isCompany
          ? tempId
          : 1
        : null,

    dealerId:
      isDealer
        ? tempId
        : null,

    loginId:
      role.toLowerCase(),

    name: isCompany
      ? "Kosmo 인증모터스"
      : isDealer
        ? "박딜러"
        : roleName,

    companyName:
      isCompany || isDealer
        ? "Kosmo 인증모터스"
        : "",

    dealerName:
      isDealer
        ? "박딜러"
        : "",

    role,

    serverRole:
      `ROLE_${role}`,

    email:
      `${role.toLowerCase()}@test.com`,

    phone:
      "010-0000-0000",

    profileImageUrl: "",

    businessNumber:
      isCompany
        ? "000-00-00000"
        : "",

    address:
      isCompany
        ? "서울특별시"
        : "",

    membershipStatus:
      isCompany
        ? true
        : null,

    tier:
      isDealer
        ? "BASIC"
        : "",

    riskScore:
      isDealer
        ? 0
        : null,

    goldenBadgeStatus:
      isCompany || isDealer
        ? false
        : null,

    notificationCount:
      isAdmin
        ? 3
        : 1,

    couponCount:
      isCompany
        ? 3
        : 0,

    preferredCar:
      isMember
        ? "현대 아반떼 SUV 가솔린"
        : "",

    hasCar:
      isMember,

    ownedCarImageUrl:
      isMember
        ? "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80"
        : "",

    ownedCarMake:
      isMember
        ? "현대"
        : "",

    ownedCarModel:
      isMember
        ? "아반떼 CN7"
        : "",

    ownedCarOdometer:
      isMember
        ? 42000
        : null,

    ownedCarYear:
      isMember
        ? 2021
        : null,

    ownedCars:
      isMember
        ? [
          {
            id: 1,
            brand: "현대",
            modelName:
              "아반떼 CN7",
            carName:
              "현대 아반떼 CN7",
            year: 2021,
            mileage: 42000,
            carNumber:
              "123가 4567",
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
  const savedUser =
    localStorage.getItem(
      AUTH_STORAGE_KEY
    );

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(
      savedUser
    );
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
  if (!user) {
    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    window.dispatchEvent(
      new Event("auth-change")
    );

    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(user)
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}

export function removeAuthUser() {
  clearAuth();
}

export function getAuthToken() {
  return localStorage.getItem(
    AUTH_TOKEN_STORAGE_KEY
  );
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(
      AUTH_TOKEN_STORAGE_KEY
    );

    return;
  }

  localStorage.setItem(
    AUTH_TOKEN_STORAGE_KEY,
    token
  );
}

export function removeAuthToken() {
  localStorage.removeItem(
    AUTH_TOKEN_STORAGE_KEY
  );
}

export function clearAuth() {
  localStorage.removeItem(
    AUTH_STORAGE_KEY
  );

  localStorage.removeItem(
    AUTH_TOKEN_STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("auth-change")
  );
}

function resolveRoleId({
  role,
  userId,
  memberId,
  companyId,
  dealerId,
}) {
  if (
    role === AUTH_ROLES.MEMBER
  ) {
    return (
      memberId ||
      userId ||
      null
    );
  }

  if (
    role === AUTH_ROLES.COMPANY
  ) {
    return (
      companyId ||
      userId ||
      null
    );
  }

  if (
    role === AUTH_ROLES.DEALER
  ) {
    return (
      dealerId ||
      userId ||
      null
    );
  }

  if (
    role === AUTH_ROLES.ADMIN
  ) {
    return (
      memberId ||
      userId ||
      null
    );
  }

  return userId || null;
}

function createOwnedCars(profile) {
  if (
    !profile.hasCar
  ) {
    return [];
  }

  return [
    {
      id:
        profile.memberId ||
        profile.userId ||
        1,

      brand:
        profile.ownedCarMake ||
        "",

      modelName:
        profile.ownedCarModel ||
        "",

      carName: [
        profile.ownedCarMake,
        profile.ownedCarModel,
      ]
        .filter(Boolean)
        .join(" "),

      year:
        profile.ownedCarYear ||
        null,

      mileage:
        profile.ownedCarOdometer ||
        null,

      imageUrl:
        profile.ownedCarImageUrl ||
        "",

      carNumber: "",
      fuel: "",
      transmission: "",
      color: "",
    },
  ];
}

export function createAuthUserFromProfile({
  loginResult,
  profileResponse,
  loginId,
}) {
  const profile =
    profileResponse?.profile ||
    {};

  const role =
    loginResult?.role ||
    AUTH_ROLES.MEMBER;

  const userId =
    profile.userId ??
    null;

  const memberId =
    profile.memberId ??
    null;

  const companyId =
    profile.companyId ??
    null;

  const dealerId =
    profile.dealerId ??
    null;

  const id =
    resolveRoleId({
      role,
      userId,
      memberId,
      companyId,
      dealerId,
    });

  return {
    isLogin: true,

    // 기존 프론트 기능에서 공통으로 사용하는 역할별 ID
    id,

    // 통합 users 테이블 ID
    userId,

    // 역할별 상세 테이블 ID
    memberId,
    companyId,
    dealerId,

    loginId:
      profile.loginId ||
      loginResult?.loginId ||
      loginId ||
      "",

    name:
      profile.name ||
      loginResult?.name ||
      loginId ||
      "",

    role,

    serverRole:
      loginResult?.serverRole ||
      profile.role ||
      "",

    email:
      profile.email ||
      "",

    phone:
      profile.phone ||
      "",

    profileImageUrl:
      profile.profileImageUrl ||
      "",

    companyName:
      profile.companyName ||
      "",

    dealerName:
      role === AUTH_ROLES.DEALER
        ? profile.name ||
        loginResult?.name ||
        ""
        : "",

    businessNumber:
      profile.businessNumber ||
      "",

    address:
      profile.address ||
      "",

    membershipStatus:
      profile.membershipStatus ??
      null,

    tier:
      profile.tier ||
      "",

    riskScore:
      profile.riskScore ??
      null,

    goldenBadgeStatus:
      profile.goldenBadgeStatus ??
      null,

    hasCar:
      profile.hasCar ??
      false,

    ownedCarImageUrl:
      profile.ownedCarImageUrl ||
      "",

    ownedCarMake:
      profile.ownedCarMake ||
      "",

    ownedCarModel:
      profile.ownedCarModel ||
      "",

    ownedCarOdometer:
      profile.ownedCarOdometer ??
      null,

    ownedCarYear:
      profile.ownedCarYear ??
      null,

    ownedCars:
      createOwnedCars(
        profile
      ),

    notificationCount: 0,
    couponCount: 0,
    preferredCar:
      profile.preferredCar ||
      "",
  };
}
