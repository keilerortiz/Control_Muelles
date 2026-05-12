// src/components/ui/Tooltip.jsx
import { useState } from "react";

export function Tooltip({ title, children, placement = "top" }) {
  const [show, setShow] = useState(false);

  // Clases de posicionamiento
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <span
          className={`
            absolute z-50 whitespace-nowrap rounded-xl border border-neutral-700
            bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-white
            shadow-xl shadow-neutral-900/20
            animate-in fade-in zoom-in-95 duration-150
            backdrop-blur-sm
            ${positionClasses[placement]}
          `}
        >
          {title}
        </span>
      )}
    </span>
  );
}