function AdminTable({
  columns,
  data,
  emptyMessage = "검색 결과가 없습니다.",
  totalCount,
}) {
  return (
    <div className="admin-table-area">
      {totalCount !== undefined && (
        <div className="admin-table-count">총 {totalCount}건</div>
      )}

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
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
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
    </div>
  );
}

export default AdminTable;