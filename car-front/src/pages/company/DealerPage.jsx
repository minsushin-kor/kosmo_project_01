import { Link } from "react-router-dom";
import PageTitle from "../../components/common/PageTitle";
import FeatureCard from "../../components/common/FeatureCard";
import DataTable from "../../components/common/DataTable";
import "../../css/common/page.css";

function DealerPage() {
  const features = [
    {
      title: "내 차량 등록",
      description: "판매할 중고차의 기본 정보, 가격, 이미지, 상태 정보를 등록합니다.",
    },
    {
      title: "내 차량 목록",
      description: "본인이 등록한 차량의 판매 상태와 상세 정보를 확인합니다.",
    },
    {
      title: "구매 문의 관리",
      description: "일반회원이 보낸 구매 문의 내역을 확인하고 응답합니다.",
    },
    {
      title: "거래 진행 관리",
      description: "상담중, 예약중, 판매완료 등 거래 상태를 관리합니다.",
    },
  ];

  const carColumns = ["차량명", "연식", "주행거리", "가격", "판매상태"];

  const carRows = [
    {
      차량명: "현대 아반떼",
      연식: "2021년식",
      주행거리: "35,000km",
      가격: "1,650만원",
      판매상태: "판매중",
    },
    {
      차량명: "기아 K5",
      연식: "2020년식",
      주행거리: "48,000km",
      가격: "1,980만원",
      판매상태: "상담중",
    },
    {
      차량명: "제네시스 G80",
      연식: "2019년식",
      주행거리: "62,000km",
      가격: "3,250만원",
      판매상태: "판매완료",
    },
  ];

  const inquiryColumns = ["문의자", "차량명", "문의내용", "상태"];

  const inquiryRows = [
    {
      문의자: "홍길동",
      차량명: "현대 아반떼",
      문의내용: "차량 실물 확인 가능할까요?",
      상태: "대기",
    },
    {
      문의자: "김민수",
      차량명: "기아 K5",
      문의내용: "가격 조정 가능한가요?",
      상태: "답변완료",
    },
  ];

  return (
    <main className="page-container">
      <PageTitle
        title="딜러 개인 페이지"
        description="딜러는 본인이 등록한 차량을 관리하고, 구매 문의와 거래 진행 상태를 확인할 수 있습니다."
      />

      <section className="page-section">
        <div className="page-action-row">
          <h2>딜러 주요 기능</h2>
          <div className="page-action-buttons">
            <Link to="/dealer/cars">내 매물 관리</Link>
            <Link to="/dealer/register-car">매물 등록</Link>
          </div>
        </div>

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
        <h2>내 등록 차량 현황</h2>
        <DataTable columns={carColumns} rows={carRows} />
      </section>

      <section className="page-section">
        <h2>최근 구매 문의</h2>
        <DataTable columns={inquiryColumns} rows={inquiryRows} />
      </section>
    </main>
  );
}

export default DealerPage;