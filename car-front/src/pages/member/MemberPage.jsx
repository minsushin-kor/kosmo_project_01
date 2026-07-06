import PageTitle from "../../components/common/PageTitle";
import FeatureCard from "../../components/common/FeatureCard";
import DataTable from "../../components/common/DataTable";
import "../../css/common/page.css";

function MemberPage() {
  const features = [
    {
      title: "관심 차량 관리",
      description: "관심 있는 차량을 저장하고 나중에 다시 확인할 수 있습니다.",
    },
    {
      title: "구매 문의 내역",
      description: "딜러 또는 판매자에게 보낸 구매 문의 내역을 확인합니다.",
    },
    {
      title: "내 차량 판매 등록",
      description: "일반회원도 본인 차량을 판매 차량으로 등록할 수 있습니다.",
    },
    {
      title: "거래 내역 확인",
      description: "구매 또는 판매가 완료된 차량 거래 내역을 확인합니다.",
    },
  ];

  const favoriteColumns = ["차량명", "연식", "주행거리", "가격", "판매자"];

  const favoriteRows = [
    {
      차량명: "현대 쏘나타",
      연식: "2021년식",
      주행거리: "42,000km",
      가격: "2,050만원",
      판매자: "딜러",
    },
    {
      차량명: "기아 스포티지",
      연식: "2022년식",
      주행거리: "28,000km",
      가격: "2,750만원",
      판매자: "일반회원",
    },
  ];

  const inquiryColumns = ["차량명", "문의내용", "문의상태", "판매상태"];

  const inquiryRows = [
    {
      차량명: "현대 쏘나타",
      문의내용: "방문해서 차량 확인 가능한가요?",
      문의상태: "답변대기",
      판매상태: "판매중",
    },
    {
      차량명: "기아 스포티지",
      문의내용: "사고 이력 확인 가능할까요?",
      문의상태: "답변완료",
      판매상태: "상담중",
    },
  ];

  const saleColumns = ["차량명", "연식", "가격", "판매상태"];

  const saleRows = [
    {
      차량명: "르노 XM3",
      연식: "2020년식",
      가격: "1,720만원",
      판매상태: "판매중",
    },
  ];

  return (
    <main className="page-container">
      <PageTitle
        title="일반회원 개인 페이지"
        description="일반회원은 관심 차량, 구매 문의 내역, 본인이 등록한 판매 차량을 확인할 수 있습니다."
      />

      <section className="page-section">
        <h2>일반회원 주요 기능</h2>

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
        <h2>관심 차량 목록</h2>
        <DataTable columns={favoriteColumns} rows={favoriteRows} />
      </section>

      <section className="page-section">
        <h2>내 구매 문의 내역</h2>
        <DataTable columns={inquiryColumns} rows={inquiryRows} />
      </section>

      <section className="page-section">
        <h2>내 판매 차량</h2>
        <DataTable columns={saleColumns} rows={saleRows} />
      </section>
    </main>
  );
}

export default MemberPage;