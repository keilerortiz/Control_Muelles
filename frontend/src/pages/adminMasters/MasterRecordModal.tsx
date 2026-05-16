import { Suspense, lazy } from "react";
import type { FormEvent } from "react";
import { Save, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Modal, ModalFooter } from "../../components/ui/Modal";
import type { MasterCatalogs } from "../../domain/types/masters";
import type { CatalogTabKey, MasterFieldValue, MasterFormState, MasterRow } from "./types";

const MasterFormFields = lazy(() =>
  import("../../components/domain/adminMasters/MasterFormFields").then((module) => ({
    default: module.MasterFormFields,
  })),
);

interface MasterRecordModalProps {
  open: boolean;
  tabKey: CatalogTabKey;
  currentLabel: string;
  editingItem: MasterRow | null;
  formState: MasterFormState;
  catalogs: MasterCatalogs;
  error: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateValue: (field: string, value: MasterFieldValue) => void;
}

export function MasterRecordModal({
  open,
  tabKey,
  currentLabel,
  editingItem,
  formState,
  catalogs,
  error,
  isPending,
  onClose,
  onSubmit,
  onUpdateValue,
}: MasterRecordModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${editingItem ? "Editar" : "Crear"} ${currentLabel || "registro"}`}
      size="lg"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Suspense fallback={<div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">Cargando formulario...</div>}>
          <MasterFormFields
            tabKey={tabKey}
            form={formState}
            catalogs={catalogs}
            updateValue={onUpdateValue}
          />
        </Suspense>

        {error ? (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        ) : null}

        <ModalFooter className="gap-3">
          <Button type="button" variant="secondary" onClick={onClose} leftIcon={<X />}>
            Cerrar
          </Button>
          <Button type="submit" disabled={isPending} leftIcon={<Save />}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
