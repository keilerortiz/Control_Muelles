import { EmptyState } from "../../ui/EmptyState";
import { DockCard } from "./DockCard";

function resolveDesktopGridColumns(count) {
  if (count <= 1) return "xl:grid-cols-1 xl:max-w-[560px] xl:mx-auto";
  if (count === 2) return "xl:grid-cols-2";
  if (count === 3) return "xl:grid-cols-3";
  if (count === 4) return "xl:grid-cols-4";
  if (count <= 6) return "xl:grid-cols-3";
  return "xl:grid-cols-4";
}

export function DockGrid({ appointments = [], detailsByAppointmentId = {}, nowMs }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No hay muelles activos"
        description="No hay información para mostrar en este momento.."
        variant="compact"
      />
    );
  }

  const desktopGridColumns = resolveDesktopGridColumns(appointments.length);

  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${desktopGridColumns}`}>
      {appointments.map((appointment) => (
        <DockCard
          key={appointment.Id}
          appointment={appointment}
          appointmentDetail={detailsByAppointmentId[appointment.Id] || null}
          nowMs={nowMs}
        />
      ))}
    </div>
  );
}
