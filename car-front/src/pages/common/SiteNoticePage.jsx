import {
  useEffect,
  useState,
} from "react";
import {
  getNotices,
} from "../../api/noticeApi";
import "../../css/common/page.css";
import "../../css/common/siteNoticePage.css";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

function SiteNoticePage() {
  const [
    siteNotices,
    setSiteNotices,
  ] = useState([]);

  const [
    selectedNotice,
    setSelectedNotice,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const notices =
          await getNotices();

        if (isMounted) {
          setSiteNotices(
            Array.isArray(notices)
              ? notices
              : []
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.message ||
            "공지사항을 불러오지 못했습니다."
          );

          setSiteNotices([]);
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

  useEffect(() => {
    if (!selectedNotice) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedNotice(null);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [selectedNotice]);

  function handleOpenNotice(notice) {
    setSelectedNotice(notice);
  }

  function handleCloseNotice() {
    setSelectedNotice(null);
  }

  function handleBackdropClick(event) {
    if (
      event.target ===
      event.currentTarget
    ) {
      handleCloseNotice();
    }
  }

  return (
    <main className="page-section site-notice-page">
      <div className="page-header">
        <h2>공지사항</h2>

        <p>
          웹사이트 관리자가 작성한
          공지사항을 확인합니다.
        </p>
      </div>

      <section className="site-notice-section">
        <div className="site-notice-list-header">
          <span className="site-notice-header-category">
            구분
          </span>

          <span className="site-notice-header-title">
            제목
          </span>

          <span className="site-notice-header-date">
            작성일
          </span>
        </div>

        {isLoading ? (
          <div className="site-notice-empty">
            공지사항을 불러오는
            중입니다.
          </div>
        ) : errorMessage ? (
          <div className="site-notice-empty site-notice-error">
            {errorMessage}
          </div>
        ) : siteNotices.length === 0 ? (
          <div className="site-notice-empty">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          <div className="site-notice-list">
            {siteNotices.map(
              (notice) => (
                <article
                  className={`site-notice-row ${notice.isImportant
                      ? "important"
                      : ""
                    }`}
                  key={notice.noticeId}
                >
                  <div className="site-notice-category">
                    {notice.isImportant && (
                      <span className="site-notice-important-badge">
                        중요
                      </span>
                    )}

                    <span>
                      {notice.category ||
                        "안내"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="site-notice-title-button"
                    onClick={() =>
                      handleOpenNotice(
                        notice
                      )
                    }
                  >
                    {notice.title}
                  </button>

                  <time
                    className="site-notice-date"
                    dateTime={
                      notice.createdAt ||
                      undefined
                    }
                  >
                    {formatDate(
                      notice.createdAt
                    )}
                  </time>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {selectedNotice && (
        <div
          className="site-notice-modal-backdrop"
          role="presentation"
          onMouseDown={
            handleBackdropClick
          }
        >
          <section
            className="site-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-notice-modal-title"
          >
            <header className="site-notice-modal-header">
              <div>
                <div className="site-notice-modal-meta">
                  {selectedNotice.isImportant && (
                    <span className="site-notice-important-badge">
                      중요
                    </span>
                  )}

                  <span>
                    {selectedNotice.category ||
                      "안내"}
                  </span>

                  <time>
                    {formatDate(
                      selectedNotice.createdAt
                    )}
                  </time>
                </div>

                <h3 id="site-notice-modal-title">
                  {selectedNotice.title}
                </h3>
              </div>

              <button
                type="button"
                className="site-notice-modal-close"
                aria-label="공지사항 닫기"
                onClick={
                  handleCloseNotice
                }
              >
                ×
              </button>
            </header>

            <div className="site-notice-modal-content">
              {selectedNotice.content}
            </div>

            <footer className="site-notice-modal-footer">
              <button
                type="button"
                className="site-notice-modal-confirm"
                onClick={
                  handleCloseNotice
                }
              >
                확인
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

export default SiteNoticePage;