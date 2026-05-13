// src/components/ui/Input.jsx
import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  inputClassName?: string;
}

export const Input = forwardRef(
  (
    {
      label,
      error,
      description,
      icon,
      iconPosition = "left",
      type = "text",
      className = "",
      inputClassName = "",
      disabled = false,
      required = false,
      ...props
    }: InputProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = props.id || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    const baseInputClasses = `
      h-9 w-full rounded-xl border bg-white px-3 text-sm text-neutral-800 shadow-sm shadow-neutral-900/5
      transition-all duration-200 ease-out outline-none
      placeholder:text-neutral-400
      disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500
      ${icon && iconPosition === "left" ? "pl-9" : ""}
      ${icon && iconPosition === "right" ? "pr-9" : ""}
      ${
        error
          ? "border-error-300 focus:border-error-500 focus:ring-4 focus:ring-error-100"
          : "border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      }
      ${isFocused ? "shadow-md shadow-neutral-900/10" : ""}
      ${inputClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold leading-5 tracking-[-0.01em] text-neutral-700"
          >
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="flex items-center justify-center text-neutral-400 [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : description ? descriptionId : undefined
            }
            className={baseInputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="flex items-center justify-center text-neutral-400 [&>svg]:h-4 [&>svg]:w-4">
                {icon}
              </span>
            </div>
          )}
        </div>

        {description && !error && (
          <p id={descriptionId} className="text-xs leading-4 text-neutral-500">
            {description}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs leading-4 text-error-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
