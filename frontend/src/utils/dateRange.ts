const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type DateRangePreset = "today" | "yesterday" | "last7days" | "thisMonth" | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoWithLocalOffset(date: Date): string {
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const offsetSign = timezoneOffsetMinutes >= 0 ? "+" : "-";
  const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
  const offsetMinutes = Math.abs(timezoneOffsetMinutes) % 60;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateInputValue(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function endOfDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

export function getTodayRange(): DateRangeValue {
  const today = new Date();
  return {
    preset: "today",
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(today),
  };
}

export function getPresetRange(preset: DateRangePreset): DateRangeValue {
  const today = startOfDay(new Date());

  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return {
      preset,
      startDate: toDateInputValue(yesterday),
      endDate: toDateInputValue(yesterday),
    };
  }

  if (preset === "last7days") {
    const startDate = addDays(today, -6);
    return {
      preset,
      startDate: toDateInputValue(startDate),
      endDate: toDateInputValue(today),
    };
  }

  if (preset === "thisMonth") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      preset,
      startDate: toDateInputValue(monthStart),
      endDate: toDateInputValue(today),
    };
  }

  return getTodayRange();
}

export function normalizeStoredRange(range: Partial<DateRangeValue> | null | undefined): DateRangeValue {
  if (!range?.startDate || !range?.endDate) {
    return getTodayRange();
  }

  if (range.startDate > range.endDate) {
    return {
      preset: "custom",
      startDate: range.endDate,
      endDate: range.startDate,
    };
  }

  return {
    preset: range.preset || "custom",
    startDate: range.startDate,
    endDate: range.endDate,
  };
}

export function getDateRangeParams(range: Partial<DateRangeValue> | null | undefined): { date_from?: string; date_to?: string } {
  const normalizedRange = normalizeStoredRange(range);
  const startDate = fromDateInputValue(normalizedRange.startDate);
  const endDate = fromDateInputValue(normalizedRange.endDate);

  return {
    date_from: startDate ? toIsoWithLocalOffset(startOfDay(startDate)) : undefined,
    date_to: endDate ? toIsoWithLocalOffset(endOfDay(endDate)) : undefined,
  };
}

export function formatDateRangeLabel(range: Partial<DateRangeValue> | null | undefined, locale = "es-CO"): string {
  const normalizedRange = normalizeStoredRange(range);

  if (normalizedRange.preset === "today" && normalizedRange.startDate === normalizedRange.endDate) {
    return "Hoy";
  }

  if (normalizedRange.preset === "yesterday" && normalizedRange.startDate === normalizedRange.endDate) {
    return "Ayer";
  }

  const startDate = fromDateInputValue(normalizedRange.startDate);
  const endDate = fromDateInputValue(normalizedRange.endDate);

  if (!startDate || !endDate) {
    return "Hoy";
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  });

  if (normalizedRange.startDate === normalizedRange.endDate) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function isDateWithinRange(value: string | Date | null | undefined, range: Partial<DateRangeValue> | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const target = new Date(value);
  const { date_from: dateFrom, date_to: dateTo } = getDateRangeParams(range);

  if (dateFrom && target < new Date(dateFrom)) {
    return false;
  }

  if (dateTo && target > new Date(dateTo)) {
    return false;
  }

  return true;
}
