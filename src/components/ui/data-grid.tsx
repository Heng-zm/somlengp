'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

export interface DataGridColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataGridProps<T = any> {
  columns: DataGridColumn<T>[];
  data: T[];
  className?: string;
  loading?: boolean;
  rowKey?: keyof T | ((record: T) => string | number);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  pagination?: boolean;
  pageSize?: number;
}

export const DataGrid = memo(function DataGrid<T = any>({
  columns,
  data,
  className,
  loading = false,
  rowKey = 'id' as keyof T,
  onRow,
  pagination = false,
  pageSize = 10,
}: DataGridProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index;
  };

  if (loading) {
    return (
      <div className={cn('w-full p-8 text-center', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => {
            const key = getRowKey(record, index);
            const rowProps = onRow?.(record, index) || {};
            
            return (
              <tr
                key={key}
                {...rowProps}
                className={cn(
                  'border-b hover:bg-muted/50 transition-colors',
                  rowProps.className
                )}
              >
                {columns.map((column) => {
                  const value = column.dataIndex 
                    ? (record as any)[column.dataIndex]
                    : record;
                  
                  const cellContent = column.render 
                    ? column.render(value, record, index)
                    : value?.toString() || '';

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
});

export default DataGrid;