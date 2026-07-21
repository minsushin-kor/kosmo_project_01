import { Link } from "react-router-dom";
import { companyDealers } from "../../data/companyData";
import { getCompanyDealersFromStorage } from "../../utils/companyDealerStorage";
import "../../css/company/companyDealersPublicPage.css";

function CompanyDealersPublicPage() {
  const storageDealers = getCompanyDealersFromStorage();

  const dealers = [...storageDealers, ...companyDealers].filter((dealer) => {
    return dealer.status === "정상";
  });

  return (
    <main className="company-dealers-public-page">
      <section className="company-dealers-public-header">
        <div>
          <span>소속 딜러</span>
          <h1>Kosmo 인증모터스 딜러보기</h1>
          <p>해당 회사에 소속된 정상 상태 딜러 목록입니다.</p>
        </div>

        <Link to="/company" className="company-dealers-public-back-btn">
          회사 페이지로
        </Link>
      </section>

      <section className="company-dealers-public-section">
        {dealers.length === 0 ? (
          <div className="company-dealers-public-empty">
            공개 가능한 딜러가 없습니다.
          </div>
        ) : (
          <div className="company-dealers-public-grid">
            {dealers.map((dealer) => (
              <article className="company-dealers-public-card" key={dealer.id}>
                {dealer.imagePreviewUrl ? (
                  <img src={dealer.imagePreviewUrl} alt="딜러 프로필" />
                ) : (
                  <div className="company-dealers-public-profile-empty">
                    {dealer.name.slice(0, 1)}
                  </div>
                )}

                <div className="company-dealers-public-info">
                  <h2>{dealer.name}</h2>
                  <p>{dealer.phone}</p>
                </div>

                <div className="company-dealers-public-meta">
                  <div>
                    <span>등록 매물</span>
                    <strong>{dealer.carCount}대</strong>
                  </div>

                  <div>
                    <span>판매 완료</span>
                    <strong>{dealer.soldCount}대</strong>
                  </div>
                </div>

                <Link
                  to={`/company/dealers/${dealer.id}`}
                  className="company-dealers-public-link"
                >
                  딜러 프로필 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CompanyDealersPublicPage;