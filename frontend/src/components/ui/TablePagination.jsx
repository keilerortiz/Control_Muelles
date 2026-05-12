import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "./Button";

export function TablePagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  embedded = false,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        embedded
          ? "border-t border-neutral-200 bg-white"
          : "rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-900/5"
      }`}
    >
      <p className="text-xs font-medium text-neutral-500">
        Mostrando{" "}
        <span className="font-semibold text-neutral-800">{from}</span>
        {"–"}
        <span className="font-semibold text-neutral-800">{to}</span>
        {" de "}
        <span className="font-semibold text-neutral-800">{total}</span>
        {" registros"}
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-8 px-0"
          onClick={() => onPageChange?.(page - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
          Página {page} / {totalPages}
        </span>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-8 px-0"
          onClick={() => onPageChange?.(page + 1)}
          disabled={!canNext}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}