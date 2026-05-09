// src/components/ui/Button.jsx
import { forwardRef } from "react";
import clsx from "clsx";

// Variantes de estilo (coherentes con el resto de la UI)
const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
  secondary:
    "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus:ring-neutral-500",
  outline:
    "bg-transparent text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus:ring-neutral-500",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500",
  danger:
    "bg-error-600 text-white hover:bg-error-700 focus:ring-error-500",
};

// Tamaños
const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

export const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      className,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
          variants[variant],
          sizes[size],
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";