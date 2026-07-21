import { useEffect, useState } from "react";
import {
  getSiteNoticeChangeEventName,
  getSiteNotices,
} from "../../utils/siteNoticeStorage";
import "../../css/common/page.css";

function SiteNoticePage() {
  const [siteNotices, setSiteNotices] = useState(() => getSiteNotices());

  useEffect(() => {
    const eventName = getSiteNoticeChangeEventName();
    const handleNoticeChange = () => {
      setSiteNotices(getSiteNotices());
    };

    window.addEventListener(eventName, handleNoticeChange);
    window.addEventListener("storage", handleNoticeChange);

    return () => {
      window.removeEventListener(eventName, handleNoticeChange);
      window.removeEventListener("storage", handleNoticeChange);
    };
  }, []);

  const sortedNotices = [...siteNotices].sort((a, b) => {
    if (a.important !== b.important) {
      return Number(b.important) - Number(a.important);
    }

    return new Date(b.date) - new Date(a.date);
  });

  return (
    <main className="page-section">
      <div className="page-header">
        <h2>공지사항</h2>
        <p>
          웹사이트 관리자가 작성한
          공지사항을 확인합니다.
        </p>
      </div>

      <section className="notice-list">
        {sortedNotices.length === 0 ? (
          <div className="notice-item">
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          sortedNotices.map((notice) => (
            <article className="notice-item" key={notice.id}>
              <div className="notice-item-header">
                <span>
                  {notice.important ? "중요 · " : ""}
                  {notice.category}
                </span>
                <time>{notice.date}</time>
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
