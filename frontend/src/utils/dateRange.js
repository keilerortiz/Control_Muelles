const DAY_IN_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateInputValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function endOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

export function getTodayRange() {
  const today = new Date();
  return {
    preset: "today",
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(today),
  };
}

export function getPresetRange(preset) {
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

export function normalizeStoredRange(range) {
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

export function getDateRangeParams(range) {
  const normalizedRange = normalizeStoredRange(range);
  const startDate = fromDateInputValue(normalizedRange.startDate);
  const endDate = fromDateInputValue(normalizedRange.endDate);

  return {
    date_from: startDate ? startOfDay(startDate).toISOString() : undefined,
    date_to: endDate ? endOfDay(endDate).toISOString() : undefined,
  };
}

export function formatDateRangeLabel(range, locale = "es-CO") {
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

export function isDateWithinRange(value, range) {
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
