// src/components/ui/Input.jsx
import { forwardRef, useId, useState } from "react";

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
    const generatedId = useId();
    const inputId = props.id || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    // Clases base del input (actualizadas a slate/brand/red)
    const baseInputClasses = `
      w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800
      transition-all duration-200 outline-none
      placeholder:text-slate-400
      disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
      ${icon && iconPosition === "left" ? "pl-9" : ""}
      ${icon && iconPosition === "right" ? "pr-9" : ""}
      ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"}
      ${isFocused ? "shadow-sm" : ""}
      ${inputClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {/* Input wrapper con ícono */}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-400">{icon}</span>
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : description ? descriptionId : undefined}
            className={baseInputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-slate-400">{icon}</span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {description && !error && (
          <p id={descriptionId} className="text-xs text-slate-500">{description}</p>
        )}

        {/* Mensaje de error */}
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
