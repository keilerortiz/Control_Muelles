type AppointmentRowLike = {
  ClientName?: string;
  OperationTypeName?: string;
  OperationType?: string;
  [key: string]: unknown;
};

export function filterAppointmentsByCatalog(
  rows: AppointmentRowLike[],
  clientFilter: string,
  operationFilter: string,
) {
  return rows.filter((row) => {
    const matchesClient = !clientFilter || row.ClientName === clientFilter;
    const matchesOperation =
      !operationFilter || (row.OperationTypeName || row.OperationType) === operationFilter;

    return matchesClient && matchesOperation;
  });
}

export function buildUniqueSortedOptions(
  rows: AppointmentRowLike[],
  getValue: (row: AppointmentRowLike) => string | undefined,
) {
  return Array.from(
    new Set(
      rows
        .map(getValue)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}
