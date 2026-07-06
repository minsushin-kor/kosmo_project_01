function AdminSearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = "검색어를 입력하세요",
  filters = [],
  checkboxFilters = [],
  onReset,
}) {
  return (
    <div className="admin-search-filter">
      <div className="admin-search-row">
        <div className="admin-search-box">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {filters.length > 0 && (
          <div className="admin-filter-box">
            {filters.map((filter) => (
              <select
                key={filter.name}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        {onReset && (
          <button
            type="button"
            className="admin-filter-reset-btn"
            onClick={onReset}
          >
            초기화
          </button>
        )}
      </div>

      {checkboxFilters.length > 0 && (
        <div className="admin-checkbox-filter-area">
          {checkboxFilters.map((filter) => (
            <div className="admin-checkbox-filter" key={filter.name}>
              <strong>{filter.label}</strong>

              <div className="admin-checkbox-list">
                {filter.options.map((option) => (
                  <label key={option.value} className="admin-checkbox-item">
                    <input
                      type="checkbox"
                      checked={filter.value.includes(option.value)}
                      onChange={() => filter.onChange(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminSearchFilter;