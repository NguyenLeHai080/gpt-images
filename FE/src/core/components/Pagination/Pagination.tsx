import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationProps } from './Pagination.types';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  showTotal = true,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 text-xs text-slate-600 bg-white select-none">
      {/* Total label */}
      {showTotal && (
        <div className="text-slate-500 font-medium">
          Hiển thị <span className="font-semibold text-slate-800">{startItem}</span> -{' '}
          <span className="font-semibold text-slate-800">{endItem}</span> trên{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span> bản ghi
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-slate-400">Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 outline-none focus:border-brand-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}/trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prev button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="Trang trước"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            const isPrevEllipsis = idx > 0 && p - pages[idx - 1] > 1;
            return (
              <React.Fragment key={p}>
                {isPrevEllipsis && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg font-semibold transition-all ${
                    currentPage === p
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
          title="Trang sau"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
