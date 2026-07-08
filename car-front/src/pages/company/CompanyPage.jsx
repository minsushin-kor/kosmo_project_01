import { Link } from "react-router-dom";
import CarCard from "../../components/car/CarCard";
import cars from "../../data/cars";
import { companyDealers } from "../../data/companyData";
import { getCompanyDealersFromStorage } from "../../utils/companyDealerStorage";
import { getDealerCarsFromStorage } from "../../utils/dealerCarStorage";
import "../../css/company/companyPage.css";

const companyNotices = [
  {
    id: 1,
    title: "허위 매물 신고 정책 안내",
    description:
      "허위 매물로 의심되는 차량은 관리자 검토 후 비활성화 처리될 수 있습니다.",
    date: "2026-07-01",
  },
  {
    id: 2,
    title: "딜러 인증 심사 기준 안내",
    description:
      "딜러 계정은 소속 회사와 관리자 승인 절차를 거친 뒤 매물 등록이 가능합니다.",
    date: "2026-07-02",
  },
  {
    id: 3,
    title: "차량 거래 안전 수칙",
    description:
      "거래 전 차량 정보, 사고 이력, 판매자 정보를 반드시 확인해 주세요.",
    date: "2026-07-03",
  },
];

function CompanyPage() {
  const storageDealers = getCompanyDealersFromStorage();
  const dealers = [...storageDealers, ...companyDealers].filter(
    (dealer) => dealer.status === "정상"
  );

  const storageCars = getDealerCarsFromStorage();
  const companyCars = [...storageCars, ...cars]
    .filter((car) => car.sellerType === "딜러" || car.sellerType === "회사 딜러")
    .slice(0, 6);

  const sellingCarCount = companyCars.filter(
    (car) => car.status === "판매중"
  ).length;

  const soldCarCount = companyCars.filter(
    (car) => car.status === "판매완료" || car.status === "거래완료"
  ).length;

  const totalDealerCarCount = dealers.reduce((sum, dealer) => {
    return sum + Number(dealer.carCount || 0);
  }, 0);

  return (
    <main className="company-public-page">
      <section className="company-public-hero">
        <div className="company-public-hero-text">
          <span className="company-public-badge">인증 중고차 판매 회사</span>

          <h1>Kosmo 인증모터스</h1>

          <p>
            검증된 딜러와 차량 정보를 기반으로 고객이 안심하고 중고차를
            확인할 수 있도록 돕는 회사 페이지입니다.
          </p>

          <div className="company-public-hero-actions">
            <Link to="/company/cars" className="company-public-primary-btn">
              매물 보러가기
            </Link>

            <a href="#company-dealers" className="company-public-outline-btn">
              소속 딜러 보기
            </a>
          </div>
        </div>

        <div className="company-public-hero-card">
          <strong>회사 정보</strong>

          <div className="company-public-info-row">
            <span>대표 연락처</span>
            <b>02-0000-0000</b>
          </div>

          <div className="company-public-info-row">
            <span>주소</span>
            <b>서울특별시 강남구 테헤란로</b>
          </div>

          <div className="company-public-info-row">
            <span>영업시간</span>
            <b>09:00 ~ 18:00</b>
          </div>

          <div className="company-public-info-row">
            <span>사업자번호</span>
            <b>000-00-00000</b>
          </div>
        </div>
      </section>

      <section className="company-public-stat-grid">
        <div className="company-public-stat-card">
          <span>소속 딜러</span>
          <strong>{dealers.length}명</strong>
        </div>

        <div className="company-public-stat-card">
          <span>등록 매물</span>
          <strong>{totalDealerCarCount}대</strong>
        </div>

        <div className="company-public-stat-card">
          <span>판매중 매물</span>
          <strong>{sellingCarCount}대</strong>
        </div>

        <div className="company-public-stat-card">
          <span>판매 완료</span>
          <strong>{soldCarCount}대</strong>
        </div>
      </section>

      <section className="company-public-section">
        <div className="company-public-section-header">
          <div>
            <h2>회사 소개</h2>
            <p>고객이 확인할 수 있는 회사 소개 영역입니다.</p>
          </div>
        </div>

        <div className="company-intro-grid">
          <article className="company-intro-card">
            <h3>검증된 딜러</h3>
            <p>
              회사 소속 딜러 정보를 관리하고, 고객이 판매자 정보를 확인할 수
              있도록 구성합니다.
            </p>
          </article>

          <article className="company-intro-card">
            <h3>차량 정보 제공</h3>
            <p>
              차량 연식, 주행거리, 사고 여부, 판매 상태 등 고객이 필요한 정보를
              보기 쉽게 제공합니다.
            </p>
          </article>

          <article className="company-intro-card">
            <h3>안전 거래 안내</h3>
            <p>
              허위 매물 신고, 딜러 인증, 차량 확인 절차를 통해 안전한 거래를
              목표로 합니다.
            </p>
          </article>
        </div>
      </section>

      <section className="company-public-section" id="company-dealers">
        <div className="company-public-section-header">
          <div>
            <h2>소속 딜러</h2>
            <p>현재 공개 가능한 정상 상태 딜러 목록입니다.</p>
          </div>

          <Link to="/company/dealers/public">딜러보기</Link>
        </div>

        <div className="company-dealer-public-grid">
          {dealers.slice(0, 4).map((dealer) => (
            <article className="company-dealer-public-card" key={dealer.id}>
              {dealer.imagePreviewUrl ? (
                <img src={dealer.imagePreviewUrl} alt="딜러 프로필" />
              ) : (
                <div className="company-dealer-public-empty">
                  {dealer.name.slice(0, 1)}
                </div>
              )}

              <div>
                <h3>{dealer.name}</h3>
                <p>{dealer.phone}</p>
              </div>

              <div className="company-dealer-public-meta">
                <span>등록 {dealer.carCount}대</span>
                <span>판매 {dealer.soldCount}대</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="company-public-section">
        <div className="company-public-section-header">
          <div>
            <h2>회사 등록 매물</h2>
            <p>회사 소속 딜러가 등록한 주요 매물입니다.</p>
          </div>

          <Link to="/company/cars">매물 전체보기</Link>
        </div>

        {companyCars.length === 0 ? (
          <div className="company-public-empty">등록된 매물이 없습니다.</div>
        ) : (
          <div className="company-public-car-grid">
            {companyCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      <section className="company-public-section">
        <div className="company-public-section-header">
          <div>
            <h2>공지사항</h2>
            <p>회사에서 고객에게 안내하는 공지입니다.</p>
          </div>

          <Link to="/company/notices">공지 더보기</Link>
        </div>

        <div className="company-notice-public-list">
          {companyNotices.map((notice) => (
            <article className="company-notice-public-card" key={notice.id}>
              <div>
                <h3>{notice.title}</h3>
                <p>{notice.description}</p>
              </div>

              <span>{notice.date}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default CompanyPage;