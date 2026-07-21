import {
  useAuth,
} from "../../hooks/useAuth";
import "../../css/common/page.css";

const companyCoupons = [
  {
    id: 1,
    name: "딜러 등록 지원 쿠폰",
    description:
      "딜러 계정 등록 관련 지원 혜택입니다.",
    expiredAt: "2026-08-31",
    status: "사용가능",
  },
  {
    id: 2,
    name: "회사 홍보 지원 쿠폰",
    description:
      "회사 공개페이지 홍보 지원 혜택입니다.",
    expiredAt: "2026-09-30",
    status: "사용가능",
  },
  {
    id: 3,
    name: "매물 관리 지원 쿠폰",
    description:
      "소속 딜러 매물 관리 지원 혜택입니다.",
    expiredAt: "2026-12-31",
    status: "사용가능",
  },
];

function CompanyCouponPage() {
  const {
    loginUser,
  } = useAuth();

  return (
    <main className="page-section">
      <div className="page-header">
        <h2>쿠폰함</h2>

        <p>
          {loginUser?.companyName ||
            loginUser?.name ||
            "회사"}
          에 지급된 쿠폰을 확인합니다.
        </p>
      </div>

      <section className="notice-list">
        {companyCoupons.length === 0 ? (
          <div className="notice-item">
            보유한 쿠폰이 없습니다.
          </div>
        ) : (
          companyCoupons.map((coupon) => (
            <article
              className="notice-item"
              key={coupon.id}
            >
              <div className="notice-item-header">
                <span>{coupon.status}</span>

                <time>
                  {coupon.expiredAt}까지
                </time>
              </div>

              <h3>{coupon.name}</h3>

              <p>{coupon.description}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default CompanyCouponPage;