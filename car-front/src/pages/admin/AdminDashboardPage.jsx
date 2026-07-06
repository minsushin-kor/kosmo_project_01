import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  adminSummaryCards,
  adminCars,
  adminChurnUsers,
  adminPendingTasks,
} from "../../data/adminData";
import "../../css/admin/adminDashboardPage.css";

function AdminDashboardPage() {
  const recentCarColumns = [
    {
      key: "carName",
      label: "차량명",
    },
    {
      key: "company",
      label: "회사",
    },
    {
      key: "dealer",
      label: "딜러",
    },
    {
      key: "price",
      label: "가격",
    },
    {
      key: "status",
      label: "상태",
      render: (car) => (
        <span className={`admin-status ${car.status}`}>{car.status}</span>
      ),
    },
    {
      key: "date",
      label: "등록일",
    },
  ];

  const churnColumns = [
    {
      key: "memberType",
      label: "회원유형",
    },
    {
      key: "name",
      label: "이름",
    },
    {
      key: "recentActivity",
      label: "최근활동",
    },
    {
      key: "churnRate",
      label: "이탈확률",
    },
    {
      key: "risk",
      label: "위험등급",
      render: (member) => (
        <span className={`admin-risk ${member.risk}`}>{member.risk}</span>
      ),
    },
    {
      key: "action",
      label: "관리상태",
    },
  ];

  return (
    <AdminLayout
      title="관리자 대시보드"
      description="회원, 기업, 딜러, 차량 매물, 이탈 위험군을 한 화면에서 관리합니다."
      actions={
        <>
          <button type="button" className="admin-outline-btn">
            보고서 다운로드
          </button>
          <button type="button" className="admin-primary-btn">
            관리 작업 확인
          </button>
        </>
      }
    >
      <section className="admin-summary-grid">
        {adminSummaryCards.map((card) => (
          <article className="admin-summary-card" key={card.title}>
            <div className="summary-card-top">
              <span>{card.title}</span>
              <em>{card.change}</em>
            </div>

            <div className="summary-value">
              <strong>{card.value}</strong>
              <span>{card.unit}</span>
            </div>

            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel admin-large-panel">
          <div className="admin-panel-header">
            <div>
              <h3>최근 등록 매물</h3>
              <p>딜러가 최근 등록한 차량 목록입니다.</p>
            </div>
            <button type="button">전체보기</button>
          </div>

          <AdminTable columns={recentCarColumns} data={adminCars.slice(0, 4)} />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>처리 대기 업무</h3>
              <p>관리자 확인이 필요한 항목입니다.</p>
            </div>
          </div>

          <ul className="pending-list">
            {adminPendingTasks.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <strong>{task.count}건</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>이탈 위험 회원</h3>
            <p>머신러닝 예측 결과를 기반으로 관리가 필요한 회원입니다.</p>
          </div>
          <button type="button">위험군 관리</button>
        </div>

        <AdminTable columns={churnColumns} data={adminChurnUsers} />
      </section>
    </AdminLayout>
  );
}

export default AdminDashboardPage;