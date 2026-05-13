// src/components/ui/Table.jsx
import { forwardRef, useCallback, useMemo, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";

interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface TableProps<TRow extends Record<string, unknown> = Record<string, unknown>> extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn[];
  rows: TRow[];
  renderCell?: (row: TRow, key: string, rowIndex: number, colIndex: number) => React.ReactNode;
  onRowClick?: (row: TRow, rowIndex: number) => void;
  getRowClassName?: (row: TRow, rowIndex: number) => string;
  virtualized?: boolean;
  forceVirtualized?: boolean;
  estimatedRowHeight?: number;
  maxVisibleRows?: number;
  overscan?: number;
  style?: CSSProperties;
}

type TableRow = Record<string, unknown> & { Id?: string | number; id?: string | number };

export const Table = forwardRef(
  (
    {
      columns,
      rows,
      renderCell,
      className = "",
      onRowClick,
      getRowClassName,
      virtualized = false,
      forceVirtualized = false,
      estimatedRowHeight = 44,
      maxVisibleRows = 14,
      overscan = 6,
      style,
      ...props
    }: TableProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const typedRows = rows as TableRow[];
    const [scrollTop, setScrollTop] = useState(0);
    const shouldVirtualize = virtualized && (typedRows.length > maxVisibleRows || forceVirtualized);
    const viewportHeight = estimatedRowHeight * maxVisibleRows;

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const virtualState = useMemo(() => {
      if (!shouldVirtualize) {
        return {
          visibleRows: typedRows,
          startIndex: 0,
          topPadding: 0,
          bottomPadding: 0,
        };
      }

      const firstVisibleIndex = Math.floor(scrollTop / estimatedRowHeight);
      const startIndex = Math.max(firstVisibleIndex - overscan, 0);
      const visibleCount = maxVisibleRows + overscan * 2;
      const endIndex = Math.min(startIndex + visibleCount, typedRows.length);

      return {
        visibleRows: typedRows.slice(startIndex, endIndex),
        startIndex,
        topPadding: startIndex * estimatedRowHeight,
        bottomPadding: Math.max(typedRows.length - endIndex, 0) * estimatedRowHeight,
      };
    }, [estimatedRowHeight, maxVisibleRows, overscan, typedRows, scrollTop, shouldVirtualize]);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      if (shouldVirtualize) {
        setScrollTop(event.currentTarget.scrollTop);
      }
    }, [shouldVirtualize]);

    return (
      <div
        className={`overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-900/5 ${className}`}
        ref={setRefs}
        onScroll={handleScroll}
        style={
          shouldVirtualize
            ? { ...style, maxHeight: viewportHeight, overflowY: "auto", scrollbarGutter: "stable" }
            : { ...style, scrollbarGutter: "stable" }
        }
        {...props}
      >
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr className="border-b border-neutral-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="h-11 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500 first:pl-5 last:pr-5"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {typedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-sm font-medium text-neutral-400"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              <>
                {virtualState.topPadding > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={columns.length} style={{ height: virtualState.topPadding, padding: 0 }} />
                  </tr>
                ) : null}

                {virtualState.visibleRows.map((row, visibleIndex) => {
                  const rowIndex = virtualState.startIndex + visibleIndex;

                  return (
                    <tr
                      key={String(row.Id || row.id || rowIndex)}
                      className={`group transition-colors duration-150 ${
                        onRowClick
                          ? "cursor-pointer hover:bg-neutral-50"
                          : "hover:bg-neutral-50"
                      } ${getRowClassName ? getRowClassName(row, rowIndex) : ""}`}
                      onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={`${String(row.Id || row.id || rowIndex)}-${column.key}`}
                          className="h-12 px-4 text-sm font-medium text-neutral-700 first:pl-5 last:pr-5"
                        >
                          {renderCell
                            ? renderCell(row, column.key, rowIndex, colIndex)
                            : (() => {
                              const value = row[column.key];
                              return value === null || value === undefined ? "-" : String(value);
                            })()}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {virtualState.bottomPadding > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={columns.length} style={{ height: virtualState.bottomPadding, padding: 0 }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";
