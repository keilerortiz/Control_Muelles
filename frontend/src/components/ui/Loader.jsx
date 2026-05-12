// src/components/ui/Loader.jsx
import { forwardRef } from "react";

export const Loader = forwardRef(
  ({ size = "md", color = "brand", className = "", ...props }, ref) => {
    // Tamaños predefinidos
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-5 w-5 border-2",
      lg: "h-8 w-8 border-2",
      xl: "h-12 w-12 border-2",
    };

    // Colores disponibles
    const colorClasses = {
      brand: "border-brand-600",
      white: "border-white",
      neutral: "border-neutral-600",
      muted: "border-neutral-400",
      error: "border-error-500",
    };

    // Border width custom
    const borderWidthStyle =
      size === "lg"
        ? { borderWidth: "3px" }
        : size === "xl"
        ? { borderWidth: "4px" }
        : {};

    return (
      <div
        ref={ref}
        className={`
          ${sizeClasses[size]}
          animate-spin rounded-full
          ${colorClasses[color]}
          border-t-transparent
          shadow-sm
          ${className}
        `}
        style={borderWidthStyle}
        {...props}
      />
    );
  }
);

Loader.displayName = "Loader";