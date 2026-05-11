import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getPresetRange, getTodayRange, normalizeStoredRange } from "../utils/dateRange";

export const useDateRangeStore = create(
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
