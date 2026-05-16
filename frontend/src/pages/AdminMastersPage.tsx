import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";

import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState } from "../components/ui/ErrorState";
import { Loader } from "../components/ui/Loader";
import { getErrorMessage, getQueryErrorMessage } from "../domain/appointmentsConfig";
import { useMasterCatalogs, useMasterMutations } from "../hooks/useMasters";
import { tabDefinitions, tabResourceByKey } from "./adminMasters/config";
import { EMPTY_MASTER_CATALOGS } from "./adminMasters/defaultCatalogs";
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
import { BusinessRuleModal } from "./adminMasters/BusinessRuleModal";
import { MasterCatalogSection } from "./adminMasters/MasterCatalogSection";
import { MasterRecordModal } from "./adminMasters/MasterRecordModal";
import { getRuleValidationError } from "./adminMasters/ruleValidation";
import { syncCatalogsAfterRuleSave } from "./adminMasters/cacheSync";

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

  const catalogs = catalogsQuery.data || EMPTY_MASTER_CATALOGS;

  const rows = (catalogs[activeTab] as MasterRow[] | undefined) || [];
  const safeMasterPage = Math.min(masterPage, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const pagedRows = rows.slice((safeMasterPage - 1) * PAGE_SIZE, safeMasterPage * PAGE_SIZE);

  const ruleRows = (catalogs.businessRules as MasterRow[] | undefined) || [];
  const safeRulePage = Math.min(rulePage, Math.max(1, Math.ceil(ruleRows.length / PAGE_SIZE)));
  const pagedRuleRows = ruleRows.slice((safeRulePage - 1) * PAGE_SIZE, safeRulePage * PAGE_SIZE);
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

  const handleRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = getRuleValidationError(catalogs, editingRule, ruleFormState);
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
        rulePage={safeRulePage}
        onRulePageChange={setRulePage}
        onCreateRule={openCreateRule}
        onEditRule={openEditRule}
        onAskDeleteRule={setRuleConfirmDelete}
      />
      <MasterCatalogSection
        activeTab={activeTab}
        rows={rows}
        pagedRows={pagedRows}
        masterPage={safeMasterPage}
        onMasterPageChange={setMasterPage}
        onActiveTabChange={setActiveTab}
        onCreateMaster={openCreateMaster}
        onEditMaster={openEditMaster}
        onAskDeleteMaster={setConfirmDelete}
      />

      <BusinessRuleModal
        open={ruleModalOpen}
        editingRule={editingRule}
        catalogs={catalogs}
        formState={ruleFormState}
        error={ruleFormError}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onClose={closeRuleModal}
        onSubmit={handleRuleSubmit}
        onChange={setRuleFormState}
      />

      <MasterRecordModal
        open={formOpen}
        tabKey={activeTab}
        currentLabel={currentTab?.label || "registro"}
        editingItem={editingItem}
        formState={formState}
        catalogs={catalogs}
        error={formError}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onClose={closeMasterForm}
        onSubmit={handleMasterSubmit}
        onUpdateValue={(field: string, value: MasterFieldValue) => setFormState((current) => ({ ...current, [field]: value }))}
      />

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
