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

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  pagination?: Partial<PaginationProps> | false;
  onRowClick?: (record: T) => void;
  striped?: boolean;
  bordered?: boolean;
  className?: string;
}
