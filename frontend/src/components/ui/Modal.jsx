// src/components/ui/Modal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  open,
  title,
  children,
  onClose,
  size = "md", // sm, md, lg, xl, full
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = "",
}) {
  const overlayRef = useRef(null);

  // Tamaños predefinidos
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw] max-h-[90vh]",
  };

  // Cerrar con ESC
  useEffect(() => {
    if (!closeOnEsc || !open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Overlay con animación */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Contenedor del modal */}
      <div
        className={`
          relative z-10 w-full ${sizeClasses[size]} max-h-[92vh] overflow-hidden
          rounded-t-3xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/20 sm:rounded-2xl
          animate-in zoom-in-95 fade-in duration-200
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5">
            {title && (
              <h3
                id="modal-title"
                className="text-base font-semibold tracking-[-0.01em] text-neutral-900"
              >
                {title}
              </h3>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 shadow-sm shadow-neutral-900/5 transition-all duration-150 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-4 focus:ring-neutral-200"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="max-h-[calc(92vh-57px)] overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ModalFooter({ children, className = "" }) {
  return (
    <div
      className={`mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end ${className}`}
    >
      {children}
    </div>
  );
}