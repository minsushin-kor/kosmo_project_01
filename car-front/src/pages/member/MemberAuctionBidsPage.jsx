import { Link } from "react-router-dom";
import { getCarById } from "../../utils/carViewUtils";
import { useAuth } from "../../hooks/useAuth";
import "../../css/member/memberAuctionBidsPage.css";

const AUCTION_BIDS_KEY = "car_front_auction_bids";
const AUCTION_WINNERS_KEY = "car_front_auction_winners";

function formatDateTime(dateText) {
    if (!dateText) {
        return "-";
    }

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
        return dateText;
    }

    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getRemainText(endDate) {
    if (!endDate) {
        return "마감일 미정";
    }

    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) {
        return "경매 종료";
    }

    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);

    if (day > 0) {
        return `${day}일 ${hour}시간 남음`;
    }

    return `${hour}시간 남음`;
}

function getAuctionBids() {
    return JSON.parse(localStorage.getItem(AUCTION_BIDS_KEY) || "[]");
}

function getAuctionWinners() {
    return JSON.parse(localStorage.getItem(AUCTION_WINNERS_KEY) || "[]");
}

function MemberAuctionBidsPage() {
    const { loginUser } = useAuth();

    const bidderType = loginUser?.role || "MEMBER";

    const bidderId =
        loginUser?.id ||
        loginUser?.memberId ||
        loginUser?.dealerId ||
        loginUser?.companyId ||
        1;

    const allBids = getAuctionBids();
    const winners = getAuctionWinners();

    const myBids = allBids
        .filter((bid) => bid.bidderType === bidderType && bid.bidderId === bidderId)
        .map((bid) => {
            const car = getCarById(bid.carId);
            const winner = winners.find((item) => item.carId === bid.carId);

            const isWinner =
                winner &&
                String(winner.bidId) === String(bid.id) &&
                winner.bidderId === bid.bidderId;

            const isAuctionDone =
                Boolean(winner) ||
                car?.auction?.status === "경매종료" ||
                car?.auction?.status === "낙찰완료" ||
                getRemainText(car?.auction?.endDate) === "경매 종료";

            return {
                ...bid,
                car,
                winner,
                isWinner,
                isAuctionDone,
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <main className="member-auction-bids-page">
            <div className="member-auction-bids-container">
                <section className="member-auction-bids-header">
                    <div>
                        <p className="page-label">MY AUCTION BID</p>
                        <h2>내 입찰 차량</h2>
                        <p>내가 비공개 입찰에 참여한 차량 목록을 확인합니다.</p>
                    </div>

                    <Link to="/" className="member-auction-primary-link">
                        차량 보러가기
                    </Link>
                </section>

                <section className="member-auction-summary-grid">
                    <article>
                        <span>전체 입찰</span>
                        <strong>{myBids.length}</strong>
                        <em>건</em>
                    </article>

                    <article>
                        <span>진행중</span>
                        <strong>
                            {
                                myBids.filter((bid) => !bid.isAuctionDone && !bid.winner)
                                    .length
                            }
                        </strong>
                        <em>건</em>
                    </article>

                    <article>
                        <span>낙찰</span>
                        <strong>{myBids.filter((bid) => bid.isWinner).length}</strong>
                        <em>건</em>
                    </article>

                    <article>
                        <span>미낙찰/종료</span>
                        <strong>
                            {
                                myBids.filter(
                                    (bid) => bid.isAuctionDone && !bid.isWinner
                                ).length
                            }
                        </strong>
                        <em>건</em>
                    </article>
                </section>

                <section className="member-auction-panel">
                    <div className="member-auction-panel-header">
                        <div>
                            <h3>입찰 내역</h3>
                            <p>
                                비공개 입찰 방식이라 다른 사람의 입찰 금액은 표시되지 않습니다.
                            </p>
                        </div>
                    </div>

                    <div className="member-auction-table-wrap">
                        <table className="member-auction-table">
                            <thead>
                                <tr>
                                    <th>차량명</th>
                                    <th>내 입찰가</th>
                                    <th>입찰 시간</th>
                                    <th>경매 마감</th>
                                    <th>결과</th>
                                    <th>관리</th>
                                </tr>
                            </thead>

                            <tbody>
                                {myBids.length > 0 ? (
                                    myBids.map((bid) => {
                                        const car = bid.car;
                                        const winner = bid.winner;

                                        if (!car) {
                                            return (
                                                <tr key={bid.id}>
                                                    <td>
                                                        <strong>{bid.carName || "삭제된 차량"}</strong>
                                                        <span>차량 정보를 찾을 수 없음</span>
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {Number(bid.bidPrice).toLocaleString()}만원
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <strong>{formatDateTime(bid.createdAt)}</strong>
                                                    </td>

                                                    <td>
                                                        <strong>-</strong>
                                                    </td>

                                                    <td>
                                                        <span className="member-bid-status 종료">
                                                            확인불가
                                                        </span>
                                                    </td>

                                                    <td>-</td>
                                                </tr>
                                            );
                                        }

                                        const remainText = getRemainText(car.auction?.endDate);

                                        let resultText = "진행중";
                                        let resultClass = "진행중";

                                        if (bid.isWinner) {
                                            resultText = "낙찰";
                                            resultClass = "낙찰";
                                        } else if (winner) {
                                            resultText = "미낙찰";
                                            resultClass = "미낙찰";
                                        } else if (bid.isAuctionDone) {
                                            resultText = "경매종료";
                                            resultClass = "종료";
                                        }

                                        return (
                                            <tr key={bid.id}>
                                                <td>
                                                    <strong>
                                                        <Link to={`/cars/${car.id}`}>{car.carName}</Link>
                                                    </strong>
                                                    <span>
                                                        {car.year}년식 · {car.region}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {Number(bid.bidPrice).toLocaleString()}만원
                                                    </strong>
                                                    <span>내 입찰가</span>
                                                </td>

                                                <td>
                                                    <strong>{formatDateTime(bid.createdAt)}</strong>
                                                </td>

                                                <td>
                                                    <strong>{formatDateTime(car.auction?.endDate)}</strong>
                                                    <span>{winner ? "낙찰 처리 완료" : remainText}</span>
                                                </td>

                                                <td>
                                                    <span className={`member-bid-status ${resultClass}`}>
                                                        {resultText}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="member-auction-actions">
                                                        <Link to={`/cars/${car.id}`}>상세보기</Link>

                                                        {bid.isWinner && winner && (
                                                            <Link to={`/member/auction-trades/${winner.id}`}>
                                                                거래진행
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="member-auction-empty">
                                            아직 입찰한 차량이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="member-auction-guide-box">
                    <h3>현재 임시 처리 상태</h3>
                    <p>
                        지금은 localStorage에 저장된 입찰 내역을 보여줍니다. 나중에
                        백엔드 연결 시에는 내 입찰 목록 API, 낙찰 결과 API로 교체하면 됩니다.
                    </p>
                </section>
            </div>
        </main>
    );
}

export default MemberAuctionBidsPage;