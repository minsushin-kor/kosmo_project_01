import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyCommissionCoupons } from "../../api/couponApi";
import { AUTH_ROLES } from "../../data/authUser";
import "../../css/common/page.css";

function CompanyCouponPage() {
  const { loginUser } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      setLoading(true);
      try {
        if (loginUser?.role === AUTH_ROLES.DEALER) {
          const res = await getMyCommissionCoupons();
          const list = Array.isArray(res) ? res : res?.data || [];
          setCoupons(list.filter((c) => String(c.status || "UNUSED").toUpperCase() === "UNUSED"));
        }
      } catch (err) {
        console.error("쿠폰 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, [loginUser]);

  return (
    <main className="page-section">
      <div className="page-header">
        <h2>🎟️ 쿠폰함</h2>
        <p>
          {loginUser?.companyName || loginUser?.name || "사용자"} 님에게 지급된 쿠폰 목록입니다.
        </p>
      </div>

      <section className="notice-list">
        {loading ? (
          <div className="notice-item">쿠폰 목록을 불러오는 중...</div>
        ) : coupons.length === 0 ? (
          <div className="notice-item">보유한 미사용 쿠폰이 없습니다.</div>
        ) : (
          coupons.map((coupon) => (
            <article className="notice-item" key={coupon.couponId || coupon.id}>
              <div className="notice-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="notice-badge" style={{ backgroundColor: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>
                  {coupon.status === "UNUSED" ? "사용가능 (50% 감면)" : coupon.status}
                </span>
                <span className="notice-date">
                  {coupon.expiredAt ? `${coupon.expiredAt.substring(0, 10)} 까지` : "기한 제한 없음"}
                </span>
              </div>
              <h3 style={{ marginTop: "8px" }}>{coupon.name}</h3>
              <p style={{ color: "#666", fontSize: "0.9rem" }}>
                {coupon.couponType === "COMMISSION_DISCOUNT"
                  ? "경매/매물 거래 성사 시 수수료 50% 감면 (1회용)"
                  : "멤버십 할인 지원 혜택"}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default CompanyCouponPage;
