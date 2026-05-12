import { FileCog, Truck, UserCog, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Modal, ModalFooter } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table } from "../components/ui/Table";
import { TablePagination } from "../components/ui/TablePagination";
import { TabPanel, Tabs } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { getErrorMessage } from "../domain/appointmentsConfig";
import { useMasterCatalogs, useMasterMutations } from "../hooks/useMasters";

const tabDefinitions = [
  { value: "clients", label: "Clientes", icon: Users, resource: "clients" },
  { value: "vehicleTypes", label: "Tipos de vehículo", icon: Truck, resource: "vehicle-types" },
  { value: "operationTypes", label: "Tipos de operación", icon: FileCog, resource: "operation-types" },
  { value: "users", label: "Usuarios", icon: UserCog, resource: "users" },
];
const PAGE_SIZE = 10;

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

  if (tabKey === "users") {
    const normalizedPassword = form.password?.trim() || "";
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      roleCodes: form.roleCodes.slice(0, 1),
      isActive: Boolean(form.isActive),
    };

    if (!isEditing || normalizedPassword) {
      payload.password = normalizedPassword;
    }

    return payload;
  }

  return {
    name: form.name.trim(),
    isActive: Boolean(form.isActive),
  };
}

function validateForm(tabKey, form, isEditing) {
  if (tabKey === "users") {
    const normalizedPassword = form.password?.trim() || "";
    if (!form.name.trim() || !form.email.trim() || form.roleCodes.length !== 1) {
      return "Nombre, correo y un único rol son obligatorios.";
    }
    if (!isEditing && !normalizedPassword) {
      return "La contraseña es obligatoria para un usuario nuevo.";
    }
    if (normalizedPassword && normalizedPassword.length < 8) {
      return "La contraseña debe tener mínimo 8 caracteres.";
    }
    return "";
  }

  if (!form.name?.trim()) {
    return "El nombre es obligatorio.";
  }

  return "";
}

function MasterFormFields({ tabKey, form, updateValue, catalogs }) {
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
        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-700">Roles</p>
          <div className="grid gap-2">
            {catalogs.roles.map((role) => (
              <Checkbox
                key={role.value}
                label={role.label}
                checked={form.roleCodes[0] === role.value}
                onChange={(event) => updateValue("roleCodes", event.target.checked ? [role.value] : [])}
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

function buildInitialRuleForm(item) {
  return {
    clientId: item?.ClientId || "",
    vehicleTypeId: item?.VehicleTypeId || "",
    operationTypeId: item?.OperationTypeId || "",
    standardTimeMinutes: item?.StandardTimeMinutes || "",
    isActive: item?.IsActive ?? true,
  };
}

function buildRulePayload(form, standardId) {
  return {
    clientId: Number(form.clientId),
    vehicleTypeId: Number(form.vehicleTypeId),
    operationTypeId: Number(form.operationTypeId),
    standardId: Number(standardId),
    isActive: Boolean(form.isActive),
  };
}

export function AdminMastersPage() {
  const queryClient = useQueryClient();
  const catalogsQuery = useMasterCatalogs();
  const mutations = useMasterMutations();

  const [activeTab, setActiveTab] = useState("clients");
  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formState, setFormState] = useState(() => buildInitialForm("clients", null));

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleFormError, setRuleFormError] = useState("");
  const [ruleConfirmDelete, setRuleConfirmDelete] = useState(null);
  const [ruleFormState, setRuleFormState] = useState(() => buildInitialRuleForm(null));
  const [rulePage, setRulePage] = useState(1);
  const [masterPage, setMasterPage] = useState(1);

  const catalogs = catalogsQuery.data || {
    clients: [],
    vehicleTypes: [],
    operationTypes: [],
    standards: [],
    users: [],
    businessRules: [],
    roles: [],
  };

  const rows = catalogs[activeTab] || [];
  const pagedRows = rows.slice((masterPage - 1) * PAGE_SIZE, masterPage * PAGE_SIZE);
  const ruleRows = catalogs.businessRules || [];
  const pagedRuleRows = ruleRows.slice((rulePage - 1) * PAGE_SIZE, rulePage * PAGE_SIZE);
  const columns = useMemo(() => createColumns(activeTab), [activeTab]);
  const currentTab = tabDefinitions.find((tab) => tab.value === activeTab);

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleFormError("");
    setRuleFormState(buildInitialRuleForm(null));
    setRuleModalOpen(true);
  };

  const openEditRule = (item) => {
    setEditingRule(item);
    setRuleFormError("");
    setRuleFormState(buildInitialRuleForm(item));
    setRuleModalOpen(true);
  };

  const closeRuleModal = () => {
    setRuleFormError("");
    setEditingRule(null);
    setRuleModalOpen(false);
  };

  const validateRuleForm = () => {
    if (!ruleFormState.clientId || !ruleFormState.vehicleTypeId || !ruleFormState.operationTypeId || !ruleFormState.standardTimeMinutes) {
      return "Completa todos los campos obligatorios.";
    }
    if (Number(ruleFormState.standardTimeMinutes) <= 0) {
      return "El tiempo estándar debe ser mayor a 0.";
    }

    const duplicate = (catalogs.businessRules || []).find((rule) => {
      if (editingRule && rule.Id === editingRule.Id) return false;
      return (
        rule.IsActive &&
        Number(rule.ClientId) === Number(ruleFormState.clientId) &&
        Number(rule.VehicleTypeId) === Number(ruleFormState.vehicleTypeId) &&
        Number(rule.OperationTypeId) === Number(ruleFormState.operationTypeId)
      );
    });
    if (duplicate) {
      return "Ya existe una regla activa para esa combinación cliente + vehículo + operación.";
    }

    return "";
  };

  const syncCatalogsAfterRuleSave = ({ createdStandard, savedRule, payload }) => {
    const selectedClient = (catalogs.clients || []).find((item) => Number(item.Id) === Number(payload.clientId));
    const selectedVehicleType = (catalogs.vehicleTypes || []).find((item) => Number(item.Id) === Number(payload.vehicleTypeId));
    const selectedOperationType = (catalogs.operationTypes || []).find((item) => Number(item.Id) === Number(payload.operationTypeId));
    const selectedStandard = createdStandard
      || (catalogs.standards || []).find((item) => Number(item.Id) === Number(payload.standardId));

    queryClient.setQueryData(["master-catalogs"], (currentCatalogs) => {
      if (!currentCatalogs) return currentCatalogs;

      const nextStandards = createdStandard
        ? [...(currentCatalogs.standards || []), createdStandard]
        : currentCatalogs.standards || [];

      const baseRule = {
        ClientId: payload.clientId,
        VehicleTypeId: payload.vehicleTypeId,
        OperationTypeId: payload.operationTypeId,
        StandardId: payload.standardId,
        IsActive: payload.isActive,
        ClientName: selectedClient?.Name || "-",
        VehicleTypeName: selectedVehicleType?.Name || "-",
        OperationTypeName: selectedOperationType?.Name || "-",
        StandardTimeMinutes: selectedStandard?.StandardTimeMinutes || Number(ruleFormState.standardTimeMinutes),
      };

      const normalizedRule = { ...baseRule, ...savedRule };
      const rules = currentCatalogs.businessRules || [];
      const ruleIndex = rules.findIndex((item) => Number(item.Id) === Number(normalizedRule.Id));
      let nextBusinessRules = rules;

      if (ruleIndex === -1) {
        nextBusinessRules = [...rules, normalizedRule];
      } else {
        nextBusinessRules = [...rules];
        nextBusinessRules[ruleIndex] = { ...rules[ruleIndex], ...normalizedRule };
      }

      return {
        ...currentCatalogs,
        standards: nextStandards,
        businessRules: nextBusinessRules,
      };
    });
  };

  const handleRuleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateRuleForm();
    if (validationError) {
      setRuleFormError(validationError);
      return;
    }

    try {
      const previousStandard = (catalogs.standards || []).find(
        (item) =>
          Number(item.StandardTimeMinutes) === Number(ruleFormState.standardTimeMinutes) && item.IsActive,
      );
      let createdStandard = null;
      let standardId = previousStandard?.Id;
      if (!standardId) {
        const typedMinutes = Number(ruleFormState.standardTimeMinutes);
        const selectedOperation = (catalogs.operationTypes || []).find(
          (item) => Number(item.Id) === Number(ruleFormState.operationTypeId),
        );
        const selectedVehicle = (catalogs.vehicleTypes || []).find(
          (item) => Number(item.Id) === Number(ruleFormState.vehicleTypeId),
        );
        const standardName = selectedOperation && selectedVehicle
          ? `${selectedOperation.Name} ${selectedVehicle.Name} (${typedMinutes} min)`
          : `Estándar ${typedMinutes} min`;
        createdStandard = await mutations.create.mutateAsync({
          resource: "standards",
          payload: {
            name: standardName,
            standardTimeMinutes: typedMinutes,
            toleranceMinutes: 0,
            description: "Creado desde regla de negocio",
            isActive: true,
          },
          skipInvalidate: true,
        });
        standardId = createdStandard.Id;
      }

      const payload = buildRulePayload(ruleFormState, standardId);
      let savedRule;
      if (editingRule) {
        savedRule = await mutations.update.mutateAsync({
          resource: "business-rules",
          id: editingRule.Id,
          payload,
          skipInvalidate: true,
        });
      } else {
        savedRule = await mutations.create.mutateAsync({
          resource: "business-rules",
          payload,
          skipInvalidate: true,
        });
      }
      syncCatalogsAfterRuleSave({ createdStandard, savedRule, payload });
      closeRuleModal();
    } catch (error) {
      setRuleFormError(getErrorMessage(error));
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleConfirmDelete) return;
    try {
      await mutations.remove.mutateAsync({
        resource: "business-rules",
        id: ruleConfirmDelete.Id,
      });
      setRuleConfirmDelete(null);
    } catch (error) {
      setRuleFormError(getErrorMessage(error));
      setRuleConfirmDelete(null);
    }
  };

  const openCreateMaster = () => {
    setEditingItem(null);
    setFormError("");
    setFormState(buildInitialForm(activeTab, null));
    setFormOpen(true);
  };

  const openEditMaster = (item) => {
    setEditingItem(item);
    setFormError("");
    setFormState(buildInitialForm(activeTab, item));
    setFormOpen(true);
  };

  const closeMasterForm = () => {
    setFormError("");
    setEditingItem(null);
    setFormOpen(false);
  };

  const handleMasterSubmit = async (event) => {
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
      closeMasterForm();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleDeleteMaster = async () => {
    if (!confirmDelete) return;
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

  useEffect(() => {
    setMasterPage(1);
  }, [activeTab]);

  useEffect(() => {
    const totalMasterPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (masterPage > totalMasterPages) {
      setMasterPage(totalMasterPages);
    }
  }, [masterPage, rows.length]);

  useEffect(() => {
    const totalRulePages = Math.max(1, Math.ceil(ruleRows.length / PAGE_SIZE));
    if (rulePage > totalRulePages) {
      setRulePage(totalRulePages);
    }
  }, [rulePage, ruleRows.length]);

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
    <div className="h-full overflow-y-auto space-y-4 px-2 pb-4 sm:px-3 lg:px-4">
      <details open className="rounded-xl border border-slate-200 bg-white p-4 transition-colors open:border-slate-300">
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-800 transition-colors hover:text-slate-900">
          Reglas de negocio
        </summary>

        <Card className="mt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cliente + Vehículo + Operación → Estándar</h2>
              <p className="text-sm text-slate-500">Define el estándar de cada operación.</p>
            </div>
            <Button type="button" onClick={openCreateRule}>
              Nueva regla
            </Button>
          </div>

          {ruleRows.length === 0 ? (
            <EmptyState title="Sin reglas" description="No hay tiempos estándar registrados." />
          ) : (
            <div className="space-y-3">
              <Table
                columns={[
                  { key: "ClientName", label: "Cliente" },
                  { key: "VehicleTypeName", label: "Tipo de vehículo" },
                  { key: "OperationTypeName", label: "Tipo de operación" },
                  { key: "StandardTimeMinutes", label: "Tiempo estándar (min)" },
                  { key: "IsActive", label: "Activo" },
                  { key: "actions", label: "Acciones", width: "180px" },
                ]}
                rows={pagedRuleRows}
                renderCell={(row, key) => {
                  if (key === "IsActive") return row.IsActive ? "Sí" : "No";
                  if (key === "actions") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditRule(row)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => setRuleConfirmDelete(row)}>
                          Desactivar
                        </Button>
                      </div>
                    );
                  }
                  return row[key] ?? "-";
                }}
              />
              <TablePagination
                page={rulePage}
                pageSize={PAGE_SIZE}
                total={ruleRows.length}
                onPageChange={setRulePage}
              />
            </div>
          )}
        </Card>
      </details>

      <details open className="rounded-xl border border-slate-200 bg-white p-4 transition-colors open:border-slate-300">
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-800 transition-colors hover:text-slate-900">
          Gestión de maestros
        </summary>

        <div className="mt-4">
          <Tabs tabs={tabDefinitions} value={activeTab} onChange={setActiveTab} />

          {tabDefinitions.map((tab) => (
            <TabPanel key={tab.value} value={tab.value} currentValue={activeTab} className="pt-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{tab.label}</h3>
                  <p className="text-sm text-slate-500">Gestión administrativa de catálogo.</p>
                </div>
                <Button type="button" onClick={openCreateMaster}>
                  Nuevo registro
                </Button>
              </div>

              {rows.length === 0 ? (
                <EmptyState title="Sin registros" description="No hay información cargada para esta pestaña." />
              ) : (
                <div className="space-y-3">
                  <Table
                    columns={columns}
                    rows={pagedRows}
                    renderCell={(row, key) => {
                      if (key === "IsActive") return row.IsActive ? "Sí" : "No";
                      if (key === "roleCodes") return row.roleCodes?.join(", ") || "-";
                      if (key === "actions") {
                        return (
                          <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => openEditMaster(row)}>
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
                  <TablePagination
                    page={masterPage}
                    pageSize={PAGE_SIZE}
                    total={rows.length}
                    onPageChange={setMasterPage}
                  />
                </div>
              )}
            </TabPanel>
          ))}
        </div>
      </details>

      <Modal
        open={ruleModalOpen}
        onClose={closeRuleModal}
        title={editingRule ? "Editar regla" : "Nueva regla"}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleRuleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Cliente"
              value={ruleFormState.clientId}
              onChange={(event) => setRuleFormState((current) => ({ ...current, clientId: event.target.value }))}
              disabled={Boolean(editingRule)}
            >
              <option value="">Seleccione</option>
              {catalogs.clients.map((item) => (
                <option key={item.Id} value={item.Id}>
                  {item.Name}
                </option>
              ))}
            </Select>

            <Select
              label="Tipo de vehículo"
              value={ruleFormState.vehicleTypeId}
              onChange={(event) => setRuleFormState((current) => ({ ...current, vehicleTypeId: event.target.value }))}
              disabled={Boolean(editingRule)}
            >
              <option value="">Seleccione</option>
              {catalogs.vehicleTypes.map((item) => (
                <option key={item.Id} value={item.Id}>
                  {item.Name}
                </option>
              ))}
            </Select>

            <Select
              label="Tipo de operación"
              value={ruleFormState.operationTypeId}
              onChange={(event) => setRuleFormState((current) => ({ ...current, operationTypeId: event.target.value }))}
              disabled={Boolean(editingRule)}
            >
              <option value="">Seleccione</option>
              {catalogs.operationTypes.map((item) => (
                <option key={item.Id} value={item.Id}>
                  {item.Name}
                </option>
              ))}
            </Select>

            <Input
              label="Tiempo estándar (min)"
              type="number"
              min="1"
              value={ruleFormState.standardTimeMinutes}
              onChange={(event) => setRuleFormState((current) => ({ ...current, standardTimeMinutes: event.target.value }))}
            />

            <div className="md:col-span-2">
              <Checkbox
                label="Regla activa"
                checked={ruleFormState.isActive}
                onChange={(event) => setRuleFormState((current) => ({ ...current, isActive: event.target.checked }))}
              />
            </div>
          </div>

          {ruleFormError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ruleFormError}
            </div>
          ) : null}

          <ModalFooter className="gap-3">
            <Button type="button" variant="secondary" onClick={closeRuleModal}>
              Cerrar
            </Button>
            <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
              {mutations.create.isPending || mutations.update.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={formOpen}
        onClose={closeMasterForm}
        title={`${editingItem ? "Editar" : "Crear"} ${currentTab?.label || "registro"}`}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleMasterSubmit}>
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
            <Button type="button" variant="secondary" onClick={closeMasterForm}>
              Cerrar
            </Button>
            <Button type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>
              {mutations.create.isPending || mutations.update.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(ruleConfirmDelete)}
        title="Desactivar regla"
        description="La eliminación se maneja como desactivación para preservar trazabilidad."
        confirmText="Desactivar"
        onCancel={() => setRuleConfirmDelete(null)}
        onConfirm={handleDeleteRule}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Desactivar registro"
        description="La eliminación se maneja como desactivación para preservar trazabilidad."
        confirmText="Desactivar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteMaster}
      />
    </div>
  );
}
