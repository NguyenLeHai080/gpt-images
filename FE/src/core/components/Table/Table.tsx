import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from '../Pagination/Pagination';
import { TableSkeleton, TableEmpty } from './TableBodyState';
import type { TableProps, Column, SortOrder } from './Table.types';

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = 'Không tìm thấy dữ liệu phù hợp',
  pagination,
  onRowClick,
  striped = false,
  bordered = false,
  className = '',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(pagination ? pagination.currentPage || 1 : 1);
  const [pageSize, setPageSize] = useState(pagination ? pagination.pageSize || 10 : 10);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.dataIndex) return data;

    return [...data].sort((a, b) => {
      const valA = a[col.dataIndex!];
      const valB = b[col.dataIndex!];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      const compare = valA > valB ? 1 : -1;
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [data, sortKey, sortOrder, columns]);

  // Pagination slicing (if not managed externally)
  const displayData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortKey(null);
      setSortOrder(null);
    }
  };

  const getRowKey = (record: T, idx: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    if (typeof rowKey === 'string' && record[rowKey]) return String(record[rowKey]);
    return record.id ? String(record.id) : String(idx);
  };

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                  className={`py-3.5 px-4 select-none ${col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''} ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key && sortOrder === 'asc' ? (
                          <ArrowUp size={13} className="text-brand-600" />
                        ) : sortKey === col.key && sortOrder === 'desc' ? (
                          <ArrowDown size={13} className="text-brand-600" />
                        ) : (
                          <ArrowUpDown size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <TableSkeleton columns={columns} />
            ) : displayData.length === 0 ? (
              <TableEmpty colSpan={columns.length} emptyText={emptyText} />
            ) : (
              displayData.map((record, rIdx) => (
                <tr
                  key={getRowKey(record, rIdx)}
                  onClick={() => onRowClick && onRowClick(record)}
                  className={`transition-colors hover:bg-orange-50/40 ${striped && rIdx % 2 === 1 ? 'bg-slate-50/50' : ''} ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      } ${bordered ? 'border-r border-slate-100 last:border-r-0' : ''}`}
                    >
                      {col.render
                        ? col.render(col.dataIndex ? record[col.dataIndex] : undefined, record, rIdx)
                        : col.dataIndex
                        ? String(record[col.dataIndex] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Integrated Pagination */}
      {pagination !== false && data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={pagination?.totalItems ?? data.length}
          pageSize={pageSize}
          onPageChange={(page) => {
            setCurrentPage(page);
            if (pagination?.onPageChange) pagination.onPageChange(page);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            if (pagination?.onPageSizeChange) pagination.onPageSizeChange(size);
          }}
          pageSizeOptions={pagination?.pageSizeOptions}
        />
      )}
    </div>
  );
}
