// src/components/ui/Button.jsx
import { forwardRef } from "react";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Variantes de estilo
const variants = {
  primary:
    "border border-brand-600 bg-brand-600 text-white shadow-sm shadow-neutral-900/10 hover:border-brand-700 hover:bg-brand-700 focus:ring-brand-500 active:bg-brand-800",
  secondary:
    "border border-neutral-200 bg-white text-neutral-700 shadow-sm shadow-neutral-900/5 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus:ring-neutral-400 active:bg-neutral-100",
  outline:
    "border border-neutral-300 bg-transparent text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 focus:ring-neutral-400 active:bg-neutral-100",
  ghost:
    "border border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-400 active:bg-neutral-200",
  danger:
    "border border-error-600 bg-error-600 text-white shadow-sm shadow-neutral-900/10 hover:border-error-700 hover:bg-error-700 focus:ring-error-500 active:bg-error-800",
};

// Tamaños
const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
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
    }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold leading-none",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-4 focus:ring-offset-0",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "select-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {leftIcon && (
          <span className="flex shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
            {leftIcon}
          </span>
        )}

        <span className="truncate">{children}</span>

        {rightIcon && (
          <span className="flex shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}
