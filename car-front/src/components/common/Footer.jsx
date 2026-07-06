import "../../css/common/footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h2>중고차 거래 플랫폼</h2>
          <p>
            일반회원, 딜러, 회사가 함께 이용하는 중고차 거래 및 관리 서비스입니다.
          </p>
        </div>

        <div className="footer-menu">
          <div>
            <h3>서비스</h3>
            <p>중고차 검색</p>
            <p>차량 판매 등록</p>
            <p>딜러 차량 관리</p>
          </div>

          <div>
            <h3>회원</h3>
            <p>일반회원</p>
            <p>딜러회원</p>
            <p>회사회원</p>
          </div>

          <div>
            <h3>고객지원</h3>
            <p>공지사항</p>
            <p>자주 묻는 질문</p>
            <p>문의하기</p>
          </div>

          <div>
            <h3>정책</h3>
            <p>이용약관</p>
            <p>개인정보처리방침</p>
            <p>허위매물 신고</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Used Car Platform. All rights reserved.</p>
        <p>본 사이트는 중고차 거래 플랫폼 프로젝트용 프론트엔드 화면입니다.</p>
      </div>
    </footer>
  );
}

export default Footer;
