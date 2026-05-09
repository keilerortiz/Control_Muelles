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
      <div className="py-2">
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
      <ModalFooter className="gap-3">
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