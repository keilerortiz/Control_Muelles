import { Clock3 } from "lucide-react";

function formatElapsedClock(elapsedSeconds: number) {
  const totalSeconds = Math.max(Math.floor(elapsedSeconds || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function DockTimer({ elapsedSeconds = 0 }: { elapsedSeconds?: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
      <Clock3 className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.8} />
      <span className="font-mono text-[11px] font-semibold tracking-wide text-neutral-700">
        {formatElapsedClock(elapsedSeconds)}
      </span>
    </div>
  );
}
