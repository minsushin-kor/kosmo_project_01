import { Link } from "react-router-dom";
import { AUTH_ROLES, getRoleName } from "../../data/authUser";
import { companyDealers } from "../../data/companyData";
import cars from "../../data/cars";
import { getCompanyDealersFromStorage } from "../../utils/companyDealerStorage";
import { getDealerCarsFromStorage } from "../../utils/dealerCarStorage";
import { useAuth } from "../../hooks/useAuth";
import "../../css/company/companyMyPage.css";

function MyPage() {
  const { loginUser } = useAuth();

  const storageDealers = getCompanyDealersFromStorage();
  const dealers = [...storageDealers, ...companyDealers];

  const storageCars = getDealerCarsFromStorage();
  const companyCars = [...storageCars, ...cars].filter(
    (car) => car.sellerType === "딜러" || car.sellerType === "회사 딜러"
  );

  const activeDealerCount = dealers.filter(
    (dealer) => dealer.status === "정상"
  ).length;

  const waitDealerCount = dealers.filter(
    (dealer) => dealer.status === "승인대기"
  ).length;

  const stopDealerCount = dealers.filter(
    (dealer) => dealer.status === "정지"
  ).length;

  const sellingCarCount = companyCars.filter(
    (car) => car.status === "판매중"
  ).length;

  const soldCarCount = companyCars.filter(
    (car) => car.status === "판매완료" || car.status === "거래완료"
  ).length;

  const counselingCarCount = companyCars.filter(
    (car) => car.status === "상담중"
  ).length;

  const reportCount = 4;
  const churnRiskCount = 2;

  const recentDealers = dealers.slice(0, 5);
  const recentCars = companyCars.slice(0, 5);

  if (!loginUser) {
    return (
      <main className="company-dashboard">
        <section className="company-dashboard-header">
          <div>
            <h1>회사 관리 대시보드</h1>
            <p>로그인이 필요한 페이지입니다.</p>
          </div>

          <Link to="/login" className="company-dashboard-header-btn">
            로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="company-dashboard">
      <section className="company-dashboard-header">
        <div>
          <h1>회사 관리 대시보드</h1>
          <p>
            회사계정으로 소속 딜러, 매물 현황, 관리 필요 항목을 확인합니다.
          </p>
        </div>

        <div className="company-dashboard-header-actions">
          <Link to="/company" className="company-dashboard-outline-btn">
            공개 회사 페이지
          </Link>

          <Link
            to="/company/dealers/create"
            className="company-dashboard-header-btn"
          >
            딜러 계정 생성
          </Link>
        </div>
      </section>

      <section className="company-dashboard-profile">
        <div className="company-profile-card">
          <div className="company-profile-icon">회</div>

          <div className="company-profile-info">
            <span>{getRoleName(loginUser.role)}</span>
            <h2>{loginUser.companyName || loginUser.name}</h2>
            <p>{loginUser.email}</p>
          </div>
        </div>

        <div className="company-info-mini-card">
          <span>아이디</span>
          <strong>{loginUser.loginId}</strong>
        </div>

        <div className="company-info-mini-card">
          <span>연락처</span>
          <strong>{loginUser.phone}</strong>
        </div>

        <div className="company-info-mini-card">
          <span>사업자번호</span>
          <strong>{loginUser.businessNumber || "000-00-00000"}</strong>
        </div>
      </section>

      <section className="company-stat-grid">
        <DashboardStatCard title="전체 딜러" value={`${dealers.length}명`} />
        <DashboardStatCard title="정상 딜러" value={`${activeDealerCount}명`} />
        <DashboardStatCard title="승인대기" value={`${waitDealerCount}명`} />
        <DashboardStatCard title="정지 딜러" value={`${stopDealerCount}명`} />
        <DashboardStatCard title="전체 매물" value={`${companyCars.length}대`} />
        <DashboardStatCard title="판매중" value={`${sellingCarCount}대`} />
        <DashboardStatCard title="상담중" value={`${counselingCarCount}대`} />
        <DashboardStatCard title="판매완료" value={`${soldCarCount}대`} />
      </section>

      <section className="company-dashboard-grid">
        <div className="company-management-card">
          <h3>관리 메뉴</h3>

          <div className="company-management-list">
            <Link to="/company/dealers">
              <strong>딜러 관리</strong>
              <span>소속 딜러 조회 / 상태 변경</span>
            </Link>

            <Link to="/company/dealers/create">
              <strong>딜러 계정 생성</strong>
              <span>회사 소속 딜러 계정 등록</span>
            </Link>

            <Link to="/company/notices">
              <strong>공지사항 관리</strong>
              <span>회사 공지 등록 / 수정</span>
            </Link>

            <Link to="/company">
              <strong>공개 회사 페이지</strong>
              <span>외부 고객이 보는 회사 페이지</span>
            </Link>
          </div>
        </div>

        <div className="company-alert-card">
          <h3>관리 필요 항목</h3>

          <div className="company-alert-list">
            <div className="company-alert-item danger">
              <span>신고 접수</span>
              <strong>{reportCount}건</strong>
              <p>신고가 들어온 딜러/매물을 확인해야 합니다.</p>
            </div>

            <div className="company-alert-item warning">
              <span>이탈 위험 딜러</span>
              <strong>{churnRiskCount}명</strong>
              <p>활동이 줄어든 딜러를 확인해야 합니다.</p>
            </div>

            <div className="company-alert-item normal">
              <span>승인대기 딜러</span>
              <strong>{waitDealerCount}명</strong>
              <p>새로 생성된 딜러 계정 상태를 확인합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="company-table-grid">
        <div className="company-table-card">
          <div className="company-card-header">
            <div>
              <h3>최근 소속 딜러</h3>
              <p>최근 등록된 딜러 목록입니다.</p>
            </div>

            <Link to="/company/dealers">전체보기</Link>
          </div>

          <div className="company-table-wrap">
            <table className="company-dashboard-table">
              <thead>
                <tr>
                  <th>딜러명</th>
                  <th>아이디</th>
                  <th>등록 매물</th>
                  <th>판매 완료</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {recentDealers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="company-empty-cell">
                      등록된 딜러가 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentDealers.map((dealer) => (
                    <tr key={dealer.id}>
                      <td>
                        <div className="company-dealer-profile">
                          {dealer.imagePreviewUrl ? (
                            <img
                              src={dealer.imagePreviewUrl}
                              alt="딜러 이미지"
                            />
                          ) : (
                            <div className="company-dealer-profile-empty">
                              {dealer.name.slice(0, 1)}
                            </div>
                          )}

                          <span>{dealer.name}</span>
                        </div>
                      </td>
                      <td>{dealer.loginId}</td>
                      <td>{dealer.carCount}대</td>
                      <td>{dealer.soldCount}대</td>
                      <td>
                        <span className={`company-status-badge ${dealer.status}`}>
                          {dealer.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="company-table-card">
          <div className="company-card-header">
            <div>
              <h3>최근 등록 매물</h3>
              <p>소속 딜러가 등록한 매물 현황입니다.</p>
            </div>

            <Link to="/">매물보기</Link>
          </div>

          <div className="company-table-wrap">
            <table className="company-dashboard-table">
              <thead>
                <tr>
                  <th>차량명</th>
                  <th>딜러</th>
                  <th>가격</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {recentCars.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="company-empty-cell">
                      등록된 매물이 없습니다.
                    </td>
                  </tr>
                ) : (
                  recentCars.map((car) => (
                    <tr key={car.id}>
                      <td>{car.carName}</td>
                      <td>{car.sellerName}</td>
                      <td>{Number(car.price).toLocaleString()}만원</td>
                      <td>
                        <span className={`company-car-status ${car.status}`}>
                          {car.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardStatCard({ title, value }) {
  return (
    <div className="company-stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default MyPage;