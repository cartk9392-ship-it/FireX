import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  currentPage,
  totalPages,
  onPageChange
}: TableProps<T>) {
  return (
    <div className="w-full flex flex-col">
      <div className="overflow-x-auto w-full border border-slate-800 rounded-lg bg-cardBg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-textWhite">
          <thead className="bg-slate-900/50 uppercase tracking-wider text-[11px] text-textGray font-bold">
            <tr>
              {columns.map((col, index) => (
                <th key={index} scope="col" className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-textGray italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-800/40 transition-colors duration-150">
                  {columns.map((col, colIndex) => {
                    const cellContent = typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode);
                    
                    return (
                      <td key={colIndex} className={`px-6 py-4.5 whitespace-nowrap text-sm text-textWhite font-medium ${col.className || ''}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {onPageChange && currentPage && totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-textGray">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 hover:border-primary disabled:opacity-30 disabled:hover:border-slate-700 text-xs font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 hover:border-primary disabled:opacity-30 disabled:hover:border-slate-700 text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Table;
