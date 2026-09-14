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
  rowSelection,
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

  // Row selection helpers
  const displayRowKeys = useMemo(() => {
    return displayData.map((rec, idx) => getRowKey(rec, idx));
  }, [displayData]);

  const isAllSelected = useMemo(() => {
    if (!rowSelection || displayRowKeys.length === 0) return false;
    return displayRowKeys.every((key) => rowSelection.selectedRowKeys.includes(key));
  }, [rowSelection, displayRowKeys]);

  const isIndeterminate = useMemo(() => {
    if (!rowSelection || displayRowKeys.length === 0) return false;
    const selectedCount = displayRowKeys.filter((key) => rowSelection.selectedRowKeys.includes(key)).length;
    return selectedCount > 0 && selectedCount < displayRowKeys.length;
  }, [rowSelection, displayRowKeys]);

  const handleSelectAll = () => {
    if (!rowSelection) return;
    if (isAllSelected) {
      const remainingKeys = rowSelection.selectedRowKeys.filter((key: string) => !displayRowKeys.includes(key));
      const remainingRows = data.filter((rec, idx) => remainingKeys.includes(getRowKey(rec, idx)));
      rowSelection.onChange(remainingKeys, remainingRows);
    } else {
      const newKeys = Array.from(new Set([...rowSelection.selectedRowKeys, ...displayRowKeys]));
      const newRows = data.filter((rec, idx) => newKeys.includes(getRowKey(rec, idx)));
      rowSelection.onChange(newKeys, newRows);
    }
  };

  const handleSelectRow = (key: string, _record: T) => {
    if (!rowSelection) return;
    const isCurrentlySelected = rowSelection.selectedRowKeys.includes(key);
    let newKeys: string[];
    if (isCurrentlySelected) {
      newKeys = rowSelection.selectedRowKeys.filter((k: string) => k !== key);
    } else {
      newKeys = [...rowSelection.selectedRowKeys, key];
    }
    const newRows = data.filter((rec, idx) => newKeys.includes(getRowKey(rec, idx)));
    rowSelection.onChange(newKeys, newRows);
  };

  const totalColSpan = columns.length + (rowSelection ? 1 : 0);

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              {rowSelection && (
                <th style={{ width: 44 }} className="py-3.5 px-3 text-center select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded-[4px] border-slate-300 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-0 cursor-pointer accent-orange-600 transition-all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                  className={`py-3.5 px-4 select-none whitespace-nowrap text-[11px] font-bold tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''
                  } ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                      col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="whitespace-nowrap">{col.title}</span>
                    {col.sortable && (
                      <span className="text-slate-400 shrink-0">
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
              <TableEmpty colSpan={totalColSpan} emptyText={emptyText} />
            ) : (
              displayData.map((record, rIdx) => {
                const key = getRowKey(record, rIdx);
                const isSelected = rowSelection ? rowSelection.selectedRowKeys.includes(key) : false;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(record)}
                    className={`transition-colors duration-150 ease-in-out ${
                      isSelected
                        ? 'bg-brand-50/60 font-medium'
                        : striped && rIdx % 2 === 1
                        ? 'bg-slate-50/50'
                        : 'hover:bg-orange-50/40'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {rowSelection && (
                      <td className="py-3 px-3 text-center select-none" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(key, record)}
                          className="w-3.5 h-3.5 rounded-[4px] border-slate-300 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-0 cursor-pointer accent-orange-600 transition-all"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 px-4 text-xs ${
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
                );
              })
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
