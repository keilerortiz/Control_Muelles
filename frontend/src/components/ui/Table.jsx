// src/components/ui/Table.jsx
import { forwardRef } from "react";

export const Table = forwardRef(
  ({ columns, rows, renderCell, className = "", onRowClick, getRowClassName, ...props }, ref) => {
    return (
      <div
        className={`overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm ${className}`}
        ref={ref}
        {...props}
      >
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-50/95 backdrop-blur-sm">
            <tr className="border-b border-neutral-200">
              {columns.map((column, idx) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 first:pl-4 last:pr-4"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-neutral-400"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.Id || row.id || rowIndex}
                  className={`border-b border-neutral-100 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-neutral-50/80" : "hover:bg-neutral-50/80"
                  } ${getRowClassName ? getRowClassName(row, rowIndex) : ""}`}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={`${row.Id || row.id || rowIndex}-${column.key}`}
                      className="px-4 py-2.5 text-sm text-neutral-700 first:pl-4 last:pr-4"
                    >
                      {renderCell
                        ? renderCell(row, column.key, rowIndex, colIndex)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";
