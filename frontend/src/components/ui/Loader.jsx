// src/components/ui/Loader.jsx
import { forwardRef } from "react";

export const Loader = forwardRef(
  ({ size = "md", color = "indigo", className = "", ...props }, ref) => {
    // Tamaños predefinidos
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-5 w-5 border-2",
      lg: "h-8 w-8 border-3",
      xl: "h-12 w-12 border-4",
    };

    // Colores disponibles
    const colorClasses = {
      indigo: "border-brand-600",
      white: "border-white",
      slate: "border-neutral-600",
      gray: "border-neutral-500",
    };

    // Para border-3 y border-4 usamos estilo inline porque Tailwind no tiene esas clases por defecto
    const borderWidthClass = size === "lg" ? "border-2" : size === "xl" ? "border-2" : "";
    const borderWidthStyle = size === "lg" ? { borderWidth: "3px" } : size === "xl" ? { borderWidth: "4px" } : {};

    return (
      <div
        ref={ref}
        className={`
          ${sizeClasses[size]} 
          animate-spin rounded-full 
          ${colorClasses[color]} 
          border-t-transparent
          ${className}
        `}
        style={borderWidthStyle}
        {...props}
      />
    );
  }
);

Loader.displayName = "Loader";