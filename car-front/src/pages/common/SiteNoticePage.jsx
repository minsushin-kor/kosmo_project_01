import { useEffect, useState } from "react";
import { getNotices } from "../../api/noticeApi";
import "../../css/common/page.css";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function SiteNoticePage() {
  const [siteNotices, setSiteNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const notices = await getNotices();

        if (isMounted) {
          setSiteNotices(Array.isArray(notices) ? notices : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.message || "공지사항을 불러오지 못했습니다."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page-section">
      <div className="page-header">
        <h2>공지사항</h2>
        <p>웹사이트 관리자가 작성한 공지사항을 확인합니다.</p>
      </div>

      <section className="notice-list">
        {isLoading ? (
          <div className="notice-item">
            <p>공지사항을 불러오는 중입니다.</p>
          </div>
        ) : errorMessage ? (
          <div className="notice-item">
            <p>{errorMessage}</p>
          </div>
        ) : siteNotices.length === 0 ? (
          <div className="notice-item">
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          siteNotices.map((notice) => (
            <article className="notice-item" key={notice.noticeId}>
              <div className="notice-item-header">
                <span>
                  {notice.isImportant ? "중요 · " : ""}
                  {notice.category || "안내"}
                </span>
                <time>{formatDate(notice.createdAt)}</time>
              </div>

              <h3>{notice.title}</h3>
              <p>{notice.content}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default SiteNoticePage;
