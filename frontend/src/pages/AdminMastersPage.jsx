import {
  BadgeCheck,
  FileCog,
  Shield,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Modal, ModalFooter } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { Tabs, TabPanel } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { getErrorMessage } from "../domain/appointmentsConfig";
import { useMasterCatalogs, useMasterMutations } from "../hooks/useMasters";

const tabDefinitions = [
  { value: "clients", label: "Clientes", icon: Users, resource: "clients" },
  { value: "vehicleTypes", label: "Tipos de vehículo", icon: Truck, resource: "vehicle-types" },
  { value: "operationTypes", label: "Tipos de operación", icon: FileCog, resource: "operation-types" },
  { value: "standards", label: "Estándares", icon: BadgeCheck, resource: "standards" },
  { value: "users", label: "Usuarios", icon: UserCog, resource: "users" },
  { value: "businessRules", label: "Reglas de negocio", icon: Shield, resource: "business-rules" },
];

function buildInitialForm(tabKey, item) {
  if (tabKey === "operationTypes") {
    return {
      name: item?.Name || "",
      standardTimeMinutes: item?.StandardTimeMinutes || 60,
      isActive: item?.IsActive ?? true,
    };
  }

  if (tabKey === "standards") {
    return {
      name: item?.Name || "",
      standardTimeMinutes: item?.StandardTimeMinutes || 60,
      toleranceMinutes: item?.ToleranceMinutes || 0,
      description: item?.Description || "",
      isActive: item?.IsActive ?? true,
    };
  }

  if (tabKey === "businessRules") {
    return {
      clientId: item?.ClientId || "",
      vehicleTypeId: item?.VehicleTypeId || "",
      operationTypeId: item?.OperationTypeId || "",
      standardId: item?.StandardId || "",
      isActive: item?.IsActive ?? true,
    };
  }

  if (tabKey === "users") {
    return {
      name: item?.Name || "",
      email: item?.Email || "",
      password: "",
      roleCodes: item?.roleCodes || [],
      isActive: item?.IsActive ?? true,
    };
  }

  return {
    name: item?.Name || "",
    isActive: item?.IsActive ?? true,
  };
}

function buildPayload(tabKey, form, isEditing) {
  if (tabKey === "operationTypes") {
    return {
      name: form.name.trim(),
      standardTimeMinutes: Number(form.standardTimeMinutes),
      isActive: Boolean(form.isActive),
    };
  }

  if (tabKey === "standards") {
    return {
      name: form.name.trim(),
      standardTimeMinutes: Number(form.standardTimeMinutes),
      toleranceMinutes: Number(form.toleranceMinutes),
      description: form.description?.trim() || null,
      isActive: Boolean(form.isActive),
    };
  }

  if (tabKey === "businessRules") {
    return {
      clientId: Number(form.clientId),
      vehicleTypeId: Number(form.vehicleTypeId),
      operationTypeId: Number(form.operationTypeId),
      standardId: Number(form.standardId),
      isActive: Boolean(form.isActive),
    };
  }

  if (tabKey === "users") {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      roleCodes: form.roleCodes,
      isActive: Boolean(form.isActive),
    };

    if (!isEditing || form.password) {
      payload.password = form.password;
    }

    return payload;
  }

  return {
    name: form.name.trim(),
    isActive: Boolean(form.isActive),
  };
}

function validateForm(tabKey, form, isEditing) {
  if (tabKey === "businessRules") {
    if (!form.clientId || !form.vehicleTypeId || !form.operationTypeId || !form.standardId) {
      return "Completa todos los selectores de la regla.";
    }
    return "";
  }

  if (tabKey === "users") {
    if (!form.name.trim() || !form.email.trim() || form.roleCodes.length === 0) {
      return "Nombre, correo y rol son obligatorios.";
    }
    if (!isEditing && !form.password) {
      return "La contraseña es obligatoria para un usuario nuevo.";
    }
    return "";
  }

  if (!form.name?.trim()) {
    return "El nombre es obligatorio.";
  }

  return "";
}

function MasterFormFields({ tabKey, form, updateValue, catalogs }) {
  if (tabKey === "businessRules") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Cliente" value={form.clientId} onChange={(event) => updateValue("clientId", event.target.value)}>
          <option value="">Seleccione</option>
          {catalogs.clients.map((item) => (
            <option key={item.Id} value={item.Id}>
              {item.Name}
            </option>
          ))}
        </Select>
        <Select label="Tipo de vehículo" value={form.vehicleTypeId} onChange={(event) => updateValue("vehicleTypeId", event.target.value)}>
          <option value="">Seleccione</option>
          {catalogs.vehicleTypes.map((item) => (
            <option key={item.Id} value={item.Id}>
              {item.Name}
            </option>
          ))}
        </Select>
        <Select label="Tipo de operación" value={form.operationTypeId} onChange={(event) => updateValue("operationTypeId", event.target.value)}>
          <option value="">Seleccione</option>
          {catalogs.operationTypes.map((item) => (
            <option key={item.Id} value={item.Id}>
              {item.Name}
            </option>
          ))}
        </Select>
        <Select label="Estándar asociado" value={form.standardId} onChange={(event) => updateValue("standardId", event.target.value)}>
          <option value="">Seleccione</option>
          {catalogs.standards.map((item) => (
            <option key={item.Id} value={item.Id}>
              {item.Name}
            </option>
          ))}
        </Select>
        <div className="md:col-span-2">
          <Checkbox
            label="Regla activa"
            checked={form.isActive}
            onChange={(event) => updateValue("isActive", event.target.checked)}
          />
        </div>
      </div>
    );
  }

  if (tabKey === "users") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} />
        <Input label="Correo" type="email" value={form.email} onChange={(event) => updateValue("email", event.target.value)} />
        <Input
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(event) => updateValue("password", event.target.value)}
          description="Déjalo vacío para conservar la actual."
        />
        <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
          <p className="text-sm font-medium text-neutral-700">Roles</p>
          <div className="grid gap-2">
            {catalogs.roles.map((role) => (
              <Checkbox
                key={role.value}
                label={role.label}
                checked={form.roleCodes.includes(role.value)}
                onChange={(event) => {
                  if (event.target.checked) {
                    updateValue("roleCodes", [...form.roleCodes, role.value]);
                    return;
                  }
                  updateValue(
                    "roleCodes",
                    form.roleCodes.filter((currentRole) => currentRole !== role.value),
                  );
                }}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Checkbox
            label="Usuario activo"
            checked={form.isActive}
            onChange={(event) => updateValue("isActive", event.target.checked)}
          />
        </div>
      </div>
    );
  }

  if (tabKey === "standards") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
        <Input label="Minutos estándar" type="number" min="1" value={form.standardTimeMinutes} onChange={(event) => updateValue("standardTimeMinutes", event.target.value)} />
        <Input label="Tolerancia" type="number" min="0" value={form.toleranceMinutes} onChange={(event) => updateValue("toleranceMinutes", event.target.value)} />
        <Textarea label="Descripción" rows={4} value={form.description} onChange={(event) => updateValue("description", event.target.value)} className="md:col-span-2" />
        <div className="md:col-span-2">
          <Checkbox label="Estándar activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
        </div>
      </div>
    );
  }

  if (tabKey === "operationTypes") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
        <Input label="Tiempo estándar base" type="number" min="1" value={form.standardTimeMinutes} onChange={(event) => updateValue("standardTimeMinutes", event.target.value)} />
        <div className="flex items-end">
          <Checkbox label="Activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
      <div className="md:col-span-2">
        <Checkbox label="Activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
      </div>
    </div>
  );
}

function createColumns(tabKey) {
  if (tabKey === "businessRules") {
    return [
      { key: "ClientName", label: "Cliente" },
      { key: "VehicleTypeName", label: "Vehículo" },
      { key: "OperationTypeName", label: "Operación" },
      { key: "StandardName", label: "Estándar" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "users") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "Email", label: "Correo" },
      { key: "roleCodes", label: "Roles" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "standards") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "StandardTimeMinutes", label: "Minutos" },
      { key: "ToleranceMinutes", label: "Tolerancia" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "operationTypes") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "StandardTimeMinutes", label: "Base minutos" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  return [
    { key: "Name", label: "Nombre" },
    { key: "IsActive", label: "Activo" },
    { key: "actions", label: "Acciones", width: "180px" },
  ];
}

export function AdminMastersPage() {
  const catalogsQuery = useMasterCatalogs();
  const mutations = useMasterMutations();
  const [activeTab, setActiveTab] = useState("clients");
  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formState, setFormState] = useState(() => buildInitialForm("clients", null));

  const catalogs = catalogsQuery.data || {
    clients: [],
    vehicleTypes: [],
    operationTypes: [],
    standards: [],
    users: [],
    businessRules: [],
    roles: [],
  };

  const currentTab = tabDefinitions.find((tab) => tab.value === activeTab);
  const rows = catalogs[activeTab] || [];
  const columns = useMemo(() => createColumns(activeTab), [activeTab]);

  const handleTabChange = (nextTab) => {
    setFormOpen(false);
    setEditingItem(null);
    setConfirmDelete(null);
    setFormError("");
    setActiveTab(nextTab);
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormError("");
    setFormState(buildInitialForm(activeTab, null));
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormError("");
    setFormState(buildInitialForm(activeTab, item));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormError("");
    setEditingItem(null);
    setFormOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(activeTab, formState, Boolean(editingItem));
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const payload = buildPayload(activeTab, formState, Boolean(editingItem));
      if (editingItem) {
        await mutations.update.mutateAsync({
          resource: currentTab.resource,
          id: editingItem.Id,
          payload,
        });
      } else {
        await mutations.create.mutateAsync({
          resource: currentTab.resource,
          payload,
        });
      }
      closeForm();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      await mutations.remove.mutateAsync({
        resource: currentTab.resource,
        id: confirmDelete.Id,
      });
      setConfirmDelete(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setConfirmDelete(null);
    }
  };

  if (catalogsQuery.isLoading && !catalogsQuery.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader />
      </div>
    );
  }

  if (catalogsQuery.isError) {
    return <ErrorState message="No se pudieron cargar los maestros administrativos" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {tabDefinitions.map((tab) => {
          const Icon = tab.icon;

          return (
            <Card key={tab.value} title={tab.label}>
              <div className="flex items-center justify-between gap-4">
                <Icon className="h-6 w-6 text-neutral-500" strokeWidth={1.75} />
                <p className="text-2xl font-bold text-neutral-800">{catalogs[tab.value]?.length || 0}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <Tabs tabs={tabDefinitions} value={activeTab} onChange={handleTabChange} />

        {tabDefinitions.map((tab) => (
          <TabPanel key={tab.value} value={tab.value} currentValue={activeTab} className="pt-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-800">{tab.label}</h2>
                <p className="text-sm text-neutral-500">Gestión centralizada desde una sola vista.</p>
              </div>
              <Button type="button" onClick={openCreate}>
                Nuevo registro
              </Button>
            </div>

            {rows.length === 0 ? (
              <EmptyState title="Sin registros" description="No hay información cargada para esta pestaña." />
            ) : (
              <Table
                columns={columns}
                rows={rows}
                renderCell={(row, key) => {
                  if (key === "IsActive") {
                    return row.IsActive ? "Sí" : "No";
                  }

                  if (key === "roleCodes") {
                    return row.roleCodes?.join(", ") || "-";
                  }

                  if (key === "actions") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(row)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => setConfirmDelete(row)}>
                          Eliminar
                        </Button>
                      </div>
                    );
                  }

                  return row[key] ?? "-";
                }}
              />
            )}
          </TabPanel>
        ))}
      </Card>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={`${editingItem ? "Editar" : "Crear"} ${currentTab?.label || "registro"}`}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <MasterFormFields
            tabKey={activeTab}
            form={formState}
            catalogs={catalogs}
            updateValue={(field, value) => setFormState((current) => ({ ...current, [field]: value }))}
          />

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <ModalFooter className="gap-3">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={mutations.create.isPending || mutations.update.isPending}
            >
              {mutations.create.isPending || mutations.update.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Desactivar registro"
        description="La eliminación se maneja como desactivación para preservar trazabilidad."
        confirmText="Desactivar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
