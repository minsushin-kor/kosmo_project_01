import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import {
  createNotice,
  deleteNotice,
  getNotices,
  updateNotice,
} from "../../api/noticeApi";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";
import "../../css/admin/adminNoticeManagePage.css";

const EMPTY_FORM = {
  noticeId: null,
  category: "안내",
  title: "",
  content: "",
  isImportant: false,
};

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

function AdminNoticeManagePage() {
  const [notices, setNotices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [form, setForm] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNotices() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await getNotices();
      setNotices(Array.isArray(response) ? response : []);
    } catch (error) {
      setErrorMessage(error.message || "공지사항을 불러오지 못했습니다.");
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    getNotices()
      .then((response) => {
        if (!isCancelled) {
          setNotices(Array.isArray(response) ? response : []);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(
            error.message || "공지사항을 불러오지 못했습니다."
          );
          setNotices([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      "전체",
      ...new Set(notices.map((notice) => notice.category || "안내")),
    ],
    [notices]
  );

  const filteredNotices = notices.filter((notice) => {
    const keyword = searchText.trim().toLowerCase();
    const title = notice.title?.toLowerCase() || "";
    const content = notice.content?.toLowerCase() || "";
    const category = notice.category || "안내";

    const keywordMatch =
      keyword.length === 0 ||
      title.includes(keyword) ||
      content.includes(keyword);

    const categoryMatch =
      categoryFilter === "전체" || category === categoryFilter;

    return keywordMatch && categoryMatch;
  });

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM });
  };

  const handleOpenEdit = (notice) => {
    setSelectedNotice(null);
    setForm({
      noticeId: notice.noticeId,
      category: notice.category || "안내",
      title: notice.title || "",
      content: notice.content || "",
      isImportant: Boolean(notice.isImportant),
    });
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      window.alert("제목과 내용을 입력해 주세요.");
      return;
    }

    const payload = {
      title,
      content,
      category: form.category,
      isImportant: form.isImportant,
    };

    try {
      setIsSaving(true);

      if (form.noticeId) {
        await updateNotice(form.noticeId, payload);
      } else {
        await createNotice(payload);
      }

      setForm(null);
      await loadNotices();
    } catch (error) {
      window.alert(error.message || "공지사항 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (notice) => {
    const confirmed = window.confirm("이 공지사항을 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteNotice(notice.noticeId);
      setSelectedNotice(null);
      await loadNotices();
    } catch (error) {
      window.alert(error.message || "공지사항 삭제에 실패했습니다.");
    }
  };

  const columns = [
    {
      key: "isImportant",
      label: "구분",
      render: (notice) =>
        notice.isImportant ? (
          <span className="admin-notice-important">중요</span>
        ) : (
          <span className="admin-notice-normal">일반</span>
        ),
    },
    {
      key: "category",
      label: "분류",
      render: (notice) => notice.category || "안내",
    },
    { key: "title", label: "제목" },
    {
      key: "createdAt",
      label: "작성일",
      render: (notice) => formatDate(notice.createdAt),
    },
    {
      key: "manage",
      label: "관리",
      render: (notice, onRowAction) => (
        <button
          type="button"
          className="small-btn"
          onClick={() => onRowAction(notice)}
        >
          상세
        </button>
      ),
    },
  ];

  const filters = [
    {
      name: "category",
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: categories.map((category) => ({
        label: category === "전체" ? "전체 분류" : category,
        value: category,
      })),
    },
  ];

  return (
    <AdminLayout
      title="공지사항 관리"
      description="전체 회사, 회원, 딜러가 확인하는 관리자 공지사항을 관리합니다."
      actions={
        <button
          type="button"
          className="admin-notice-create-btn"
          onClick={handleOpenCreate}
        >
          공지 작성
        </button>
      }
    >
      <section className="admin-manage-panel">
        <div className="admin-manage-panel-header">
          <h3>공지사항 목록</h3>
        </div>

        <AdminSearchFilter
          searchValue={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="공지 제목, 내용 검색"
          filters={filters}
          checkboxFilters={[]}
          onReset={() => {
            setSearchText("");
            setCategoryFilter("전체");
          }}
        />

        {errorMessage ? (
          <div className="admin-empty-message">
            <p>{errorMessage}</p>
            <button type="button" className="small-btn" onClick={loadNotices}>
              다시 불러오기
            </button>
          </div>
        ) : (
          <AdminTable
            columns={columns}
            data={isLoading ? [] : filteredNotices}
            totalCount={isLoading ? 0 : filteredNotices.length}
            emptyMessage={
              isLoading
                ? "공지사항을 불러오는 중입니다."
                : "등록된 공지사항이 없습니다."
            }
            onRowAction={setSelectedNotice}
          />
        )}
      </section>

      {selectedNotice && (
        <AdminModal
          title="공지사항 상세"
          onClose={() => setSelectedNotice(null)}
        >
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>구분</span>
              <strong>{selectedNotice.isImportant ? "중요" : "일반"}</strong>
            </div>
            <div className="admin-detail-row">
              <span>분류</span>
              <strong>{selectedNotice.category || "안내"}</strong>
            </div>
            <div className="admin-detail-row">
              <span>제목</span>
              <strong>{selectedNotice.title}</strong>
            </div>
            <div className="admin-detail-row admin-detail-content-row">
              <span>내용</span>
              <strong>{selectedNotice.content}</strong>
            </div>
            <div className="admin-detail-row">
              <span>작성일</span>
              <strong>{formatDate(selectedNotice.createdAt)}</strong>
            </div>
          </div>

          <div className="admin-notice-detail-actions">
            <button
              type="button"
              className="status-btn wait"
              onClick={() => handleOpenEdit(selectedNotice)}
            >
              수정
            </button>
            <button
              type="button"
              className="status-btn stop"
              onClick={() => handleDelete(selectedNotice)}
            >
              삭제
            </button>
          </div>
        </AdminModal>
      )}

      {form && (
        <AdminModal
          title={form.noticeId ? "공지사항 수정" : "공지사항 작성"}
          onClose={() => setForm(null)}
        >
          <form className="admin-notice-form" onSubmit={handleSave}>
            <label>
              <span>분류</span>
              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
                disabled={isSaving}
              >
                <option value="안내">안내</option>
                <option value="점검">점검</option>
                <option value="정책">정책</option>
                <option value="이벤트">이벤트</option>
              </select>
            </label>

            <label>
              <span>제목</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="공지사항 제목"
                maxLength="200"
                disabled={isSaving}
              />
            </label>

            <label>
              <span>내용</span>
              <textarea
                name="content"
                value={form.content}
                onChange={handleFormChange}
                placeholder="공지사항 내용"
                rows="7"
                disabled={isSaving}
              />
            </label>

            <label className="admin-notice-check-label">
              <input
                type="checkbox"
                name="isImportant"
                checked={form.isImportant}
                onChange={handleFormChange}
                disabled={isSaving}
              />
              <span>중요 공지로 표시</span>
            </label>

            <div className="admin-modal-btn-area">
              <button
                type="button"
                className="modal-sub-btn"
                onClick={() => setForm(null)}
                disabled={isSaving}
              >
                취소
              </button>
              <button
                type="submit"
                className="modal-main-btn"
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminNoticeManagePage;
