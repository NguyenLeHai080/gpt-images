import React from 'react';
import type { PaginationProps } from '../Pagination/Pagination.types';

export interface Column<T> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export type SortOrder = 'asc' | 'desc' | null;

export interface RowSelection<T> {
  selectedRowKeys: string[];
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
}

export interface TablePaginationConfig extends Partial<PaginationProps> {
  serverSide?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  pagination?: TablePaginationConfig | false;
  onRowClick?: (record: T) => void;
  rowSelection?: RowSelection<T>;
  striped?: boolean;
  bordered?: boolean;
  className?: string;
}
