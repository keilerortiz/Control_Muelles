import { Suspense, lazy, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Modal, ModalFooter } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { getErrorMessage, getQueryErrorMessage } from "../domain/appointmentsConfig";
import { useMasterCatalogs, useMasterMutations } from "../hooks/useMasters";
import type { MasterCatalogs } from "../domain/types/masters";
import { tabDefinitions, tabResourceByKey } from "./adminMasters/config";
import {
  buildInitialForm,
  buildInitialRuleForm,
  buildPayload,
  buildRulePayload,
  validateForm,
} from "./adminMasters/formBuilders";
import type { MasterFieldValue, MasterRow, TabKey } from "./adminMasters/types";
import { PAGE_SIZE } from "./adminMasters/types";
import { BusinessRulesSection } from "./adminMasters/BusinessRulesSection";
import { MasterCatalogSection } from "./adminMasters/MasterCatalogSection";
import { syncCatalogsAfterRuleSave } from "./adminMasters/cacheSync";

const MasterFormFields = lazy(() =>
  import("../components/domain/adminMasters/MasterFormFields").then((module) => ({
    default: module.MasterFormFields,
  })),
);

export function AdminMastersPage() {
  const queryClient = useQueryClient();
  const catalogsQuery = useMasterCatalogs();
  const mutations = useMasterMutations();

  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [editingItem, setEditingItem] = useState<MasterRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<MasterRow | null>(null);
  const [formState, setFormState] = useState(() => buildInitialForm("clients", null));

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MasterRow | null>(null);
  const [ruleFormError, setRuleFormError] = useState("");
  const [ruleConfirmDelete, setRuleConfirmDelete] = useState<MasterRow | null>(null);
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

  const rows = (catalogs[activeTab] as MasterRow[] | undefined) || [];
  const pagedRows = rows.slice((masterPage - 1) * PAGE_SIZE, masterPage * PAGE_SIZE);
  const ruleRows = (catalogs.businessRules as MasterRow[] | undefined) || [];
  const pagedRuleRows = ruleRows.slice((rulePage - 1) * PAGE_SIZE, rulePage * PAGE_SIZE);
  const currentTab = tabDefinitions.find((tab) => tab.value === activeTab);
  const currentResource = tabResourceByKey[activeTab];

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleFormError("");
    setRuleFormState(buildInitialRuleForm(null));
    setRuleModalOpen(true);
  };

  const openEditRule = (item: MasterRow) => {
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

  const handleRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      let createdStandard: MasterRow | null = null;
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

      if (standardId === undefined || standardId === null || standardId === "") {
        throw new Error("No fue posible determinar el estándar para la regla.");
      }
      const payload = buildRulePayload(ruleFormState, standardId);
      let savedRule;
      if (editingRule) {
        savedRule = await mutations.update.mutateAsync({
          resource: "business-rules",
          id: editingRule.Id as string | number,
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
      syncCatalogsAfterRuleSave({
        queryClient,
        catalogs,
        ruleMinutes: Number(ruleFormState.standardTimeMinutes),
        createdStandard,
        savedRule,
        payload,
      });
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
        id: ruleConfirmDelete.Id as string | number,
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

  const openEditMaster = (item: MasterRow) => {
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

  const handleMasterSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          resource: currentResource,
          id: editingItem.Id as string | number,
          payload,
        });
      } else {
        await mutations.create.mutateAsync({
          resource: currentResource,
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
        resource: currentResource,
        id: confirmDelete.Id as string | number,
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
    return (
      <ErrorState
        message={getQueryErrorMessage(catalogsQuery.error, "No se pudieron cargar los maestros administrativos")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!currentTab) {
    return <ErrorState message="La pestaña seleccionada no es válida." onRetry={() => setActiveTab("clients")} />;
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 px-2 pb-4 sm:px-3 lg:px-4">
      <BusinessRulesSection
        ruleRows={ruleRows}
        pagedRuleRows={pagedRuleRows}
        rulePage={rulePage}
        onRulePageChange={setRulePage}
        onCreateRule={openCreateRule}
        onEditRule={openEditRule}
        onAskDeleteRule={setRuleConfirmDelete}
      />
      <MasterCatalogSection
        activeTab={activeTab}
        rows={rows}
        pagedRows={pagedRows}
        masterPage={masterPage}
        onMasterPageChange={setMasterPage}
        onActiveTabChange={setActiveTab}
        onCreateMaster={openCreateMaster}
        onEditMaster={openEditMaster}
        onAskDeleteMaster={setConfirmDelete}
      />

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
              {(catalogs.clients || []).map((item) => (
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
              {(catalogs.vehicleTypes || []).map((item) => (
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
              {(catalogs.operationTypes || []).map((item) => (
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
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
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
          <Suspense fallback={<div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">Cargando formulario...</div>}>
            <MasterFormFields
              tabKey={activeTab}
              form={formState}
              catalogs={catalogs}
              updateValue={(field: string, value: MasterFieldValue) => setFormState((current) => ({ ...current, [field]: value }))}
            />
          </Suspense>

          {formError ? (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
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
