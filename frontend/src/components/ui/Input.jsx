// src/components/ui/Input.jsx
import { forwardRef, useState } from "react";

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
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Clases base del input
    const baseInputClasses = `
      w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-800
      transition-all duration-200 outline-none
      placeholder:text-neutral-400
      disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500
      ${icon && iconPosition === "left" ? "pl-9" : ""}
      ${icon && iconPosition === "right" ? "pr-9" : ""}
      ${error ? "border-error-300 focus:border-error-500 focus:ring-error-200" : "border-neutral-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"}
      ${isFocused ? "shadow-sm" : ""}
      ${inputClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-neutral-700">
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        {/* Input wrapper con ícono */}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-neutral-400">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            className={baseInputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-neutral-400">{icon}</span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {description && !error && (
          <p className="text-xs text-neutral-500">{description}</p>
        )}

        {/* Mensaje de error */}
        {error && (
          <p id={props.id ? `${props.id}-error` : undefined} className="text-xs text-error-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";