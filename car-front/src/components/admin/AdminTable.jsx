import {
  useState,
} from "react";

function AdminTable({
  columns,
  data,
  emptyMessage = "검색 결과가 없습니다.",
  totalCount,
  pageSize = 5,
  onRowAction,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const count =
    totalCount !== undefined
      ? totalCount
      : data.length;

  const totalPage = Math.max(
    1,
    Math.ceil(data.length / pageSize)
  );

  /*
   * 데이터가 줄어서 현재 페이지가 총 페이지보다 커질 경우
   * setState를 실행하지 않고 화면에서 사용할 페이지만 보정한다.
   *
   * 예:
   * 기존 4페이지 → 검색 결과가 2페이지
   * currentPage는 4지만 safeCurrentPage는 2가 된다.
   */
  const safeCurrentPage = Math.min(
    currentPage,
    totalPage
  );

  const startIndex =
    (safeCurrentPage - 1) * pageSize;

  const endIndex =
    startIndex + pageSize;

  const pageData = data.slice(
    startIndex,
    endIndex
  );

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => {
      const safePage = Math.min(
        prevPage,
        totalPage
      );

      return Math.max(
        1,
        safePage - 1
      );
    });
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => {
      const safePage = Math.min(
        prevPage,
        totalPage
      );

      return Math.min(
        totalPage,
        safePage + 1
      );
    });
  };

  return (
    <div className="admin-table-area">
      <div className="admin-table-top">
        <div className="admin-table-count">
          총 {count}건
        </div>

        {data.length > 0 && (
          <div className="admin-table-page-info">
            {safeCurrentPage} / {totalPage}
          </div>
        )}
      </div>

      <div className="admin-manage-table-wrap">
        <table className="admin-manage-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.label}
                </th>
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
                        ? column.render(
                            row,
                            onRowAction
                          )
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="admin-empty-message"
                >
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
            disabled={
              safeCurrentPage === 1
            }
          >
            이전
          </button>

          <span>
            {safeCurrentPage} / {totalPage}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={
              safeCurrentPage === totalPage
            }
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminTable;