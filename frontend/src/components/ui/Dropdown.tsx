// src/components/ui/Dropdown.jsx
import { useState, useRef, useEffect, forwardRef, cloneElement } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, ReactElement, ReactNode } from "react";

type DropdownAlign = "left" | "right";
type DropdownSide = "bottom" | "top";

interface DropdownProps {
  trigger: ReactElement;
  children?: ReactNode;
  align?: DropdownAlign;
  side?: DropdownSide;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
}

type TriggerProps = {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

type TriggerElement = ReactElement<TriggerProps>;

export const Dropdown = forwardRef(
  (
    {
      trigger,
      children,
      align = "left", // "left" | "right"
      side = "bottom", // "bottom" | "top"
      className = "",
      open: controlledOpen,
      onOpenChange,
    }: DropdownProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    };

    const triggerRef = useRef<HTMLElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0 });

    const updatePosition = () => {
      if (!triggerRef.current || !dropdownRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();

      let top =
        side === "bottom"
          ? triggerRect.bottom + 8
          : triggerRect.top - dropdownRect.height - 8;

      let left =
        align === "left"
          ? triggerRect.left
          : triggerRect.right - dropdownRect.width;

      // Ajustar para que no se salga de la pantalla
      if (left + dropdownRect.width > window.innerWidth) {
        left = window.innerWidth - dropdownRect.width - 8;
      }

      if (left < 8) left = 8;

      if (top + dropdownRect.height > window.innerHeight) {
        top = triggerRect.top - dropdownRect.height - 8;
      }

      if (top < 8) top = 8;

      setPosition({ top, left });
    };

    useEffect(() => {
      if (open) {
        updatePosition();
        window.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);
      }

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }, [open]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
      if (!open) return;

      const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
        const targetNode = event.target as Node | null;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(targetNode) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(targetNode)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Cerrar con Escape
    useEffect(() => {
      if (!open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open]);

    const toggle = () => setOpen(!open);
    const triggerElementWithRef = trigger as TriggerElement;

    const triggerElement = cloneElement(triggerElementWithRef, {
      onClick: (e: MouseEvent<HTMLElement>) => {
        triggerElementWithRef.props?.onClick?.(e);
        toggle();
      },
    });

    return (
      <>
        <span
          className="inline-flex"
          ref={(node) => {
            triggerRef.current = node as HTMLElement | null;
          }}
        >
          {triggerElement}
        </span>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              className={`absolute z-50 min-w-[180px] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-900/10 ring-1 ring-neutral-900/5 ${className}`}
              style={{ top: position.top, left: position.left }}
              role="menu"
            >
              {children}
            </div>,
            document.body
          )}
      </>
    );
  }
);

Dropdown.displayName = "Dropdown";

// Item del dropdown
export const DropdownItem = forwardRef(
  (
    { children, icon, onClick, disabled = false, className = "" }: {
      children?: ReactNode;
      icon?: ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    },
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <button
        ref={ref}
        className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition-all duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 focus:outline-none ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${className}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        role="menuitem"
      >
        {icon && (
          <span className="flex shrink-0 items-center justify-center text-neutral-400 transition-colors group-hover:text-neutral-600 group-focus:text-neutral-600 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}

        <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      </button>
    );
  }
);

DropdownItem.displayName = "DropdownItem";

// Divisor
export const DropdownDivider = () => (
  <hr className="my-1.5 border-t border-neutral-200" />
);
