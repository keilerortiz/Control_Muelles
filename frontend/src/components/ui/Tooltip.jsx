// src/components/ui/Tooltip.jsx
import { useState } from "react";

export function Tooltip({ title, children, placement = "top" }) {
  const [show, setShow] = useState(false);

  // Clases de posicionamiento
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-1",
    right: "left-full top-1/2 -translate-y-1/2 ml-1",
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`absolute z-10 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs font-medium text-white shadow-md transition-opacity ${positionClasses[placement]}`}
        >
          {title}
        </span>
      )}
    </span>
  );
}