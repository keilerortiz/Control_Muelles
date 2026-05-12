// src/components/ui/ConfirmDialog.jsx
import { useEffect, useRef } from "react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title = "Confirmar acción",
  description = "¿Estás seguro de que deseas realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "danger", // "danger" | "primary" | "secondary"
  onConfirm,
  onCancel,
  closeOnOverlayClick = false, // Evita cierres accidentales
  closeOnEsc = true, // Permite cerrar con ESC (por si se prefiere)
}) {
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Enfocar el botón cancelar por defecto (acción menos destructiva)
  useEffect(() => {
    if (open && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEsc={closeOnEsc}
    >
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 shadow-sm shadow-neutral-900/5">
        <p className="text-sm leading-6 text-neutral-600">{description}</p>
      </div>

      <ModalFooter className="mt-4 gap-2.5 border-t border-neutral-200 pt-4">
        <Button
          ref={cancelButtonRef}
          variant="secondary"
          onClick={onCancel}
        >
          {cancelText}
        </Button>

        <Button
          ref={confirmButtonRef}
          variant={confirmVariant}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}