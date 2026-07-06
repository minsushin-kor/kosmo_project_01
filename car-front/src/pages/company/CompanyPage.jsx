import PageTitle from "../../components/common/PageTitle";
import FeatureCard from "../../components/common/FeatureCard";
import DataTable from "../../components/common/DataTable";
import "../../css/common/page.css";

function CompanyPage() {
  const features = [
    {
      title: "회사 정보 관리",
      description: "회사명, 사업자등록번호, 대표자명, 연락처 정보를 관리합니다.",
    },
    {
      title: "딜러 계정 관리",
      description: "회사 소속 딜러 계정을 생성, 조회, 수정, 비활성화할 수 있습니다.",
    },
    {
      title: "소속 차량 관리",
      description: "소속 딜러들이 등록한 차량 목록과 판매 상태를 확인합니다.",
    },
    {
      title: "정산 관리",
      description: "거래 완료 차량의 수수료, 정산 금액, 정산 상태를 확인합니다.",
    },
  ];

  const dealerColumns = ["딜러명", "등록 차량 수", "판매 완료", "상태"];

  const dealerRows = [
    {
      딜러명: "김딜러",
      "등록 차량 수": "12대",
      "판매 완료": "5대",
      상태: "활성",
    },
    {
      딜러명: "이딜러",
      "등록 차량 수": "8대",
      "판매 완료": "3대",
      상태: "활성",
    },
    {
      딜러명: "박딜러",
      "등록 차량 수": "4대",
      "판매 완료": "1대",
      상태: "비활성",
    },
  ];

  return (
    <main className="page-container">
      <PageTitle
        title="회사 페이지"
        description="회사는 소속 딜러 계정을 관리하고, 딜러가 등록한 차량 현황과 거래 상태를 확인할 수 있습니다."
      />

      <section className="page-section">
        <h2>회사 주요 기능</h2>

        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section className="page-section">
        <h2>소속 딜러 현황</h2>

        <DataTable columns={dealerColumns} rows={dealerRows} />
      </section>
    </main>
  );
}

export default CompanyPage;