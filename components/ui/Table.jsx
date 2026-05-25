import EmptyState from "@/components/ui/EmptyState";
import { MDM_SEARCH, MDM_TABLE, MDM_TABLE_HEAD, MDM_TABLE_ROW, MDM_TABLE_TH, MDM_TABLE_WRAP } from "@/lib/themeClasses";

export function Table({
  columns,
  data,
  emptyMessage = "No data available.",
  renderRow,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search table",
}) {
  return (
    <div className={MDM_TABLE_WRAP}>
      {typeof onSearchChange === "function" ? (
        <div className="border-b border-[var(--border-color)] p-3">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={MDM_SEARCH}
          />
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className={MDM_TABLE}>
          <thead className={MDM_TABLE_HEAD}>
            <tr>
              {columns.map((column) => (
                <th key={column} className={MDM_TABLE_TH}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="mdm-table-td" colSpan={columns.length}>
                  <EmptyState title="No results" description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id ?? index} className={MDM_TABLE_ROW}>
                  {renderRow(item)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
