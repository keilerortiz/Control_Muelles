import { useEffect, useState } from "react";

import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { useAppointmentActions, useAppointments } from "../hooks/useAppointments";

export function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  const appointmentsQuery = useAppointments({ skip: 0, take: 50, search: debouncedSearch || undefined });
  const actions = useAppointmentActions();

  const createDraft = async () => {
    await actions.create.mutateAsync({
      clientId: 1,
      operationTypeId: 1,
      vehicleTypeId: 1,
      estimatedTons: 10,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Citas"
        actions={
          <Button onClick={createDraft} disabled={actions.create.isPending}>
            {actions.create.isPending ? "Creando..." : "Nueva cita"}
          </Button>
        }
      >
        <Input
          label="Buscar por cliente o placa"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar..."
        />
      </Card>

      {appointmentsQuery.isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader />
        </div>
      ) : null}

      {!appointmentsQuery.isLoading && (appointmentsQuery.data?.items?.length || 0) === 0 ? (
        <EmptyState title="Sin citas" description="No hay resultados para el filtro actual." />
      ) : null}

      {!appointmentsQuery.isLoading && (appointmentsQuery.data?.items?.length || 0) > 0 ? (
        <AppointmentsTable rows={appointmentsQuery.data.items} />
      ) : null}
    </div>
  );
}
