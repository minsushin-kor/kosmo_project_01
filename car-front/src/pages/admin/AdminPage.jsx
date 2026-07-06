import PageTitle from "../../components/common/PageTitle";
import FeatureCard from "../../components/common/FeatureCard";
import DataTable from "../../components/common/DataTable";
import "../../css/common/page.css";

function AdminPage() {
  const features = [
    {
      title: "전체 매출 조회",
      description:
        "중고차 거래 수수료, 매물 등록 수수료, 월별 매출 현황을 조회합니다.",
    },
    {
      title: "이탈율 예측 조회",
      description:
        "딜러회원과 일반회원의 활동 데이터를 기반으로 이탈 위험도를 확인합니다.",
    },
    {
      title: "이탈 위험군 관리",
      description:
        "이탈 가능성이 높은 회원에게 쿠폰 지급, 프로모션 제공, 상담 관리를 진행합니다.",
    },
    {
      title: "웹사이트 멤버 관리",
      description:
        "일반회원, 딜러회원, 회사회원, 관리자 계정의 상태를 관리합니다.",
    },
  ];

  const revenueColumns = [
    "구분",
    "이번 달 건수",
    "이번 달 매출",
    "누적 매출",
  ];

  const revenueRows = [
    {
      구분: "중고차 거래 수수료",
      "이번 달 건수": "38건",
      "이번 달 매출": "7,600,000원",
      "누적 매출": "84,300,000원",
    },
    {
      구분: "매물 등록 수수료",
      "이번 달 건수": "215건",
      "이번 달 매출": "2,150,000원",
      "누적 매출": "26,900,000원",
    },
    {
      구분: "광고/노출 상품",
      "이번 달 건수": "24건",
      "이번 달 매출": "1,920,000원",
      "누적 매출": "18,400,000원",
    },
  ];

  const churnColumns = [
    "회원유형",
    "회원명",
    "최근활동",
    "이탈확률",
    "위험등급",
    "관리상태",
  ];

  const churnRows = [
    {
      회원유형: "딜러회원",
      회원명: "김딜러",
      최근활동: "14일 전",
      이탈확률: "82%",
      위험등급: "높음",
      관리상태: "쿠폰 지급 필요",
    },
    {
      회원유형: "딜러회원",
      회원명: "이딜러",
      최근활동: "5일 전",
      이탈확률: "43%",
      위험등급: "보통",
      관리상태: "모니터링",
    },
    {
      회원유형: "일반회원",
      회원명: "홍길동",
      최근활동: "21일 전",
      이탈확률: "76%",
      위험등급: "높음",
      관리상태: "프로모션 발송 필요",
    },
    {
      회원유형: "일반회원",
      회원명: "김민수",
      최근활동: "2일 전",
      이탈확률: "18%",
      위험등급: "낮음",
      관리상태: "정상",
    },
  ];

  const couponColumns = [
    "대상회원",
    "회원유형",
    "위험등급",
    "지급혜택",
    "처리상태",
  ];

  const couponRows = [
    {
      대상회원: "김딜러",
      회원유형: "딜러회원",
      위험등급: "높음",
      지급혜택: "매물 등록 수수료 30% 할인",
      처리상태: "지급대기",
    },
    {
      대상회원: "홍길동",
      회원유형: "일반회원",
      위험등급: "높음",
      지급혜택: "차량 조회 쿠폰",
      처리상태: "발송완료",
    },
    {
      대상회원: "이딜러",
      회원유형: "딜러회원",
      위험등급: "보통",
      지급혜택: "프리미엄 노출 3일권",
      처리상태: "검토중",
    },
  ];

  const memberColumns = [
    "회원유형",
    "이름",
    "아이디",
    "가입상태",
    "이용상태",
  ];

  const memberRows = [
    {
      회원유형: "일반회원",
      이름: "홍길동",
      아이디: "hong123",
      가입상태: "가입완료",
      이용상태: "활성",
    },
    {
      회원유형: "딜러회원",
      이름: "김딜러",
      아이디: "dealer01",
      가입상태: "회사발급",
      이용상태: "활성",
    },
    {
      회원유형: "회사회원",
      이름: "서울중고차상사",
      아이디: "seoulcar",
      가입상태: "승인완료",
      이용상태: "활성",
    },
    {
      회원유형: "일반회원",
      이름: "박지훈",
      아이디: "park88",
      가입상태: "가입완료",
      이용상태: "정지",
    },
  ];

  return (
    <main className="page-container">
      <PageTitle
        title="웹사이트 관리자 페이지"
        description="웹사이트 전체 매출, 회원 이탈율 예측 결과, 이탈 위험군 관리, 전체 멤버 관리를 담당하는 운영자 페이지입니다."
      />

      <section className="page-section">
        <h2>관리자 주요 기능</h2>

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
        <h2>전체 매출 현황</h2>
        <DataTable columns={revenueColumns} rows={revenueRows} />
      </section>

      <section className="page-section">
        <h2>딜러회원 / 일반회원 이탈율 예측 현황</h2>
        <DataTable columns={churnColumns} rows={churnRows} />
      </section>

      <section className="page-section">
        <h2>이탈 위험군 고객 관리</h2>
        <DataTable columns={couponColumns} rows={couponRows} />
      </section>

      <section className="page-section">
        <h2>웹사이트 멤버 관리</h2>
        <DataTable columns={memberColumns} rows={memberRows} />
      </section>
    </main>
  );
}

export default AdminPage;