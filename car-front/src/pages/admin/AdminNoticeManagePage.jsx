import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import AdminSearchFilter from "../../components/admin/AdminSearchFilter";
import AdminModal from "../../components/admin/AdminModal";
import {
  getSiteNotices,
  saveSiteNotices,
} from "../../utils/siteNoticeStorage";
import "../../css/admin/adminManagePage.css";
import "../../css/admin/adminModal.css";
import "../../css/admin/adminNoticeManagePage.css";

const EMPTY_FORM = {
  id: null,
  category: "안내",
  title: "",
  content: "",
  date: "",
  important: false,
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AdminNoticeManagePage() {
  const [notices, setNotices] = useState(() => getSiteNotices());
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [form, setForm] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const categories = useMemo(
    () => ["전체", ...new Set(notices.map((notice) => notice.category))],
    [notices]
  );

  const filteredNotices = notices.filter((notice) => {
    const keyword = searchText.trim().toLowerCase();
    const keywordMatch =
      keyword.length === 0 ||
      notice.title.toLowerCase().includes(keyword) ||
      notice.content.toLowerCase().includes(keyword);

    const categoryMatch =
      categoryFilter === "전체" || notice.category === categoryFilter;

    return keywordMatch && categoryMatch;
  });

  const updateNotices = (nextNotices) => {
    setNotices(nextNotices);
    saveSiteNotices(nextNotices);
  };

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM, date: getTodayString() });
  };

  const handleOpenEdit = (notice) => {
    setSelectedNotice(null);
    setForm({ ...notice });
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content || !form.date) {
      window.alert("제목, 내용, 작성일을 입력해 주세요.");
      return;
    }

    if (form.id) {
      updateNotices(
        notices.map((notice) =>
          notice.id === form.id
            ? { ...form, title, content }
            : notice
        )
      );
    } else {
      const nextId =
        notices.length === 0
          ? 1
          : Math.max(...notices.map((notice) => Number(notice.id))) + 1;

      updateNotices([
        {
          ...form,
          id: nextId,
          title,
          content,
        },
        ...notices,
      ]);
    }

    setForm(null);
  };

  const handleDelete = (notice) => {
    const confirmed = window.confirm("이 공지사항을 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    updateNotices(notices.filter((item) => item.id !== notice.id));
    setSelectedNotice(null);
  };

  const columns = [
    {
      key: "important",
      label: "구분",
      render: (notice) =>
        notice.important ? (
          <span className="admin-notice-important">중요</span>
        ) : (
          <span className="admin-notice-normal">일반</span>
        ),
    },
    { key: "category", label: "분류" },
    { key: "title", label: "제목" },
    { key: "date", label: "작성일" },
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

        <AdminTable
          columns={columns}
          data={filteredNotices}
          totalCount={filteredNotices.length}
          emptyMessage="등록된 공지사항이 없습니다."
          onRowAction={setSelectedNotice}
        />
      </section>

      {selectedNotice && (
        <AdminModal
          title="공지사항 상세"
          onClose={() => setSelectedNotice(null)}
        >
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>구분</span>
              <strong>{selectedNotice.important ? "중요" : "일반"}</strong>
            </div>
            <div className="admin-detail-row">
              <span>분류</span>
              <strong>{selectedNotice.category}</strong>
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
              <strong>{selectedNotice.date}</strong>
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
          title={form.id ? "공지사항 수정" : "공지사항 작성"}
          onClose={() => setForm(null)}
        >
          <form className="admin-notice-form" onSubmit={handleSave}>
            <label>
              <span>분류</span>
              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
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
              />
            </label>

            <label>
              <span>작성일</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </label>

            <label className="admin-notice-check-label">
              <input
                type="checkbox"
                name="important"
                checked={form.important}
                onChange={handleFormChange}
              />
              <span>중요 공지로 표시</span>
            </label>

            <div className="admin-modal-btn-area">
              <button
                type="button"
                className="modal-sub-btn"
                onClick={() => setForm(null)}
              >
                취소
              </button>
              <button type="submit" className="modal-main-btn">
                저장
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </AdminLayout>
  );
}

export default AdminNoticeManagePage;
