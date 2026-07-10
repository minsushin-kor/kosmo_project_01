import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import {
  adminSummaryCards,
  adminCars,
  adminPendingTasks,
} from "../../data/adminData";
import {
  getCompanyChurnUsers,
  getDealerChurnUsers,
} from "../../api/adminChurnApi";
import "../../css/admin/adminDashboardPage.css";

function SummaryChart({ data }) {
  const width = 260;
  const height = 80;
  const padding = 8;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y =
      height -
      padding -
      ((value - min) / (max - min || 1)) * (height - padding * 2);

    return {
      x,
      y,
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      className="summary-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline className="summary-chart-line" points={linePoints} />

      {points.map((point, index) => (
        <circle
          key={index}
          className="summary-chart-dot"
          cx={point.x}
          cy={point.y}
          r="3"
        />
      ))}
    </svg>
  );
}

function TestPage() {
  const [companyChurnUsers, setCompanyChurnUsers] = useState([]);
  const [dealerChurnUsers, setDealerChurnUsers] = useState([]);

  useEffect(() => {
    fetchDashboardChurnUsers();
  }, []);

  const fetchDashboardChurnUsers = async () => {
    const companyData = await getCompanyChurnUsers();
    const dealerData = await getDealerChurnUsers();

    setCompanyChurnUsers(companyData);
    setDealerChurnUsers(dealerData);
  };

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

  const companyChurnColumns = [
    {
      key: "memberType",
      label: "회원유형",
      render: (member) => member.memberType || member.type,
    },
    {
      key: "name",
      label: "회사명",
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

  const dealerChurnColumns = [
    {
      key: "memberType",
      label: "회원유형",
      render: (member) => member.memberType || member.type,
    },
    {
      key: "name",
      label: "딜러명",
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
      title="테스트테스트테스트테스트테스트테스트테스트테스트테스트테스트"
      description="테스트테스트테스트 이 페이지에서만 수정하세요 테스트테스트테스트."
      actions={
        <>
          <button type="button" className="admin-outline-btn">
            그냥버튼
          </button>
          <button type="button" className="admin-primary-btn">
            파란버튼
          </button>
        </>
      }
    >
      <section className="admin-summary-grid">
        {adminSummaryCards.map((card) => (
          <article
            className={`admin-summary-card summary-${card.color}`}
            key={card.title}
          >
            <div className="summary-card-header">
              <div className="summary-icon">{card.icon}</div>

              <div className="summary-trend-box">
                <em className={card.trend}>
                  {card.trend === "up" ? "↑" : "↓"} {card.change}
                </em>
                <span>{card.changeText}</span>
              </div>
            </div>

            <div className="summary-card-body">
              <h3>{card.title}</h3>

              <div className="summary-value">
                <strong>{card.value}</strong>
                <span>{card.unit}</span>
              </div>

              <p>{card.description}</p>
            </div>

            <SummaryChart data={card.chartData} />
          </article>
        ))}
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel admin-large-panel">
          <div className="admin-panel-header">
            <div>
              <h3>최근 등록 매물</h3>
              <p>관리자 대시보드 테스트용 최근 등록 매물입니다.</p>
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

      <section>
        <article className="admin-panel">
          <h3>테스트 용 컴포넌트</h3>
          <p>관리자 대시보드에 넣고 싶은 기능을 이 영역에 임시로 추가하세요</p>
          <p>src/pages/test/TestPage.jsx</p>
        </article>
      </section>

      <section className="admin-churn-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>회사 이탈 위험 회원</h3>
              <p>회사 계정 기준 이탈 위험 예측 결과입니다.</p>
            </div>

            <Link to="/admin/churn/company" className="admin-panel-link-btn">
              위험군 관리
            </Link>
          </div>

          <AdminTable
            columns={companyChurnColumns}
            data={companyChurnUsers}
            emptyMessage="조회된 회사 이탈 위험 데이터가 없습니다."
          />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>딜러 이탈 위험 회원</h3>
              <p>회사에서 생성한 딜러 계정 기준 이탈 위험 예측 결과입니다.</p>
            </div>

            <Link to="/admin/churn/dealer" className="admin-panel-link-btn">
              위험군 관리
            </Link>
          </div>

          <AdminTable
            columns={dealerChurnColumns}
            data={dealerChurnUsers}
            emptyMessage="조회된 딜러 이탈 위험 데이터가 없습니다."
          />
        </article>
      </section>
    </AdminLayout>
  );
}

export default TestPage;