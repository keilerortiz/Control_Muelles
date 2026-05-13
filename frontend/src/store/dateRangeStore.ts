import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getPresetRange, getTodayRange, normalizeStoredRange, type DateRangePreset, type DateRangeValue } from "../utils/dateRange";

interface DateRangeStoreState {
  range: DateRangeValue;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (range: Partial<Pick<DateRangeValue, "startDate" | "endDate">>) => void;
  resetToToday: () => void;
}

export const useDateRangeStore = create<DateRangeStoreState>()(
  persist(
    (set) => ({
      range: getTodayRange(),
      setPreset: (preset) => set({ range: getPresetRange(preset) }),
      setCustomRange: ({ startDate, endDate }) =>
        set((state) => ({
          range: normalizeStoredRange({
            preset: "custom",
            startDate: startDate || state.range.startDate,
            endDate: endDate || state.range.endDate,
          }),
        })),
      resetToToday: () => set({ range: getTodayRange() }),
    }),
    {
      name: "date-range-storage",
    },
  ),
);
