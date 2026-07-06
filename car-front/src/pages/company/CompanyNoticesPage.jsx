import "../../css/common/page.css";

function CompanyNoticesPage() {
  return (
    <main className="page-section">
      <div className="page-header">
        <h2>회사 공지사항</h2>
        <p>회사 공지사항과 거래 관련 안내를 확인하는 페이지입니다.</p>
      </div>

      <section className="notice-list">
        <article className="notice-item">
          <h3>허위 매물 신고 정책 안내</h3>
          <p>
            허위 매물로 의심되는 차량은 관리자 검토 후 비활성화 처리될 수 있습니다.
          </p>
        </article>

        <article className="notice-item">
          <h3>딜러 인증 심사 기준 안내</h3>
          <p>
            딜러 계정은 소속 회사와 관리자 승인 절차를 거친 뒤 매물 등록이 가능합니다.
          </p>
        </article>

        <article className="notice-item">
          <h3>차량 거래 안전 수칙</h3>
          <p>
            거래 전 차량 정보, 사고 이력, 판매자 정보를 반드시 확인해 주세요.
          </p>
        </article>
      </section>
    </main>
  );
}

export default CompanyNoticesPage;