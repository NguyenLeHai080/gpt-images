import { Inbox } from 'lucide-react';
import type { Column } from './Table.types';

export function TableSkeleton<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {columns.map((col) => (
            <td key={col.key} className="py-4 px-4">
              <div className="h-4 bg-slate-200/80 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableEmpty({ colSpan, emptyText }: { colSpan: number; emptyText: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400">
        <div className="flex flex-col items-center justify-center gap-2">
          <Inbox size={32} className="stroke-slate-300" />
          <span className="font-medium text-xs text-slate-500">{emptyText}</span>
        </div>
      </td>
    </tr>
  );
}