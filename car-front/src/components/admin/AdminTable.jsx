import { useEffect, useState } from "react";

function AdminTable({
  columns,
  data,
  emptyMessage = "검색 결과가 없습니다.",
  totalCount,
  pageSize = 5,
  onRowAction,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const count = totalCount !== undefined ? totalCount : data.length;
  const totalPage = Math.ceil(data.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handlePrevPage = () => {
    if (currentPage === 1) {
      return;
    }

    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage === totalPage) {
      return;
    }

    setCurrentPage(currentPage + 1);
  };

  return (
    <div className="admin-table-area">
      <div className="admin-table-top">
        <div className="admin-table-count">총 {count}건</div>

        {data.length > 0 && (
          <div className="admin-table-page-info">
            {currentPage} / {totalPage}
          </div>
        )}
      </div>

      <div className="admin-manage-table-wrap">
        <table className="admin-manage-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageData.length > 0 ? (
              pageData.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row, onRowAction)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="admin-empty-message">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > pageSize && (
        <div className="admin-pagination">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            이전
          </button>

          <span>
            {currentPage} / {totalPage}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPage}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminTable;