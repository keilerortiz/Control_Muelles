// src/components/ui/Table.jsx
import { forwardRef, useCallback, useMemo, useState } from "react";

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
    },
    ref,
  ) => {
    const [scrollTop, setScrollTop] = useState(0);
    const shouldVirtualize = virtualized && (rows.length > maxVisibleRows || forceVirtualized);
    const viewportHeight = estimatedRowHeight * maxVisibleRows;

    const setRefs = useCallback(
      (node) => {
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
          visibleRows: rows,
          startIndex: 0,
          topPadding: 0,
          bottomPadding: 0,
        };
      }

      const firstVisibleIndex = Math.floor(scrollTop / estimatedRowHeight);
      const startIndex = Math.max(firstVisibleIndex - overscan, 0);
      const visibleCount = maxVisibleRows + overscan * 2;
      const endIndex = Math.min(startIndex + visibleCount, rows.length);

      return {
        visibleRows: rows.slice(startIndex, endIndex),
        startIndex,
        topPadding: startIndex * estimatedRowHeight,
        bottomPadding: Math.max(rows.length - endIndex, 0) * estimatedRowHeight,
      };
    }, [estimatedRowHeight, maxVisibleRows, overscan, rows, scrollTop, shouldVirtualize]);

    const handleScroll = useCallback((event) => {
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
            {rows.length === 0 ? (
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
                      key={row.Id || row.id || rowIndex}
                      className={`group transition-colors duration-150 ${
                        onRowClick
                          ? "cursor-pointer hover:bg-neutral-50"
                          : "hover:bg-neutral-50"
                      } ${getRowClassName ? getRowClassName(row, rowIndex) : ""}`}
                      onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={`${row.Id || row.id || rowIndex}-${column.key}`}
                          className="h-12 px-4 text-sm font-medium text-neutral-700 first:pl-5 last:pr-5"
                        >
                          {renderCell
                            ? renderCell(row, column.key, rowIndex, colIndex)
                            : row[column.key]}
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