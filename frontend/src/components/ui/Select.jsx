import { forwardRef, useId, useState } from "react";

export const Select = forwardRef(
  (
    {
      label,
      error,
      description,
      required = false,
      disabled = false,
      className = "",
      selectClassName = "",
      children,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const selectId = props.id || `select-${generatedId}`;
    const errorId = `${selectId}-error`;
    const descriptionId = `${selectId}-description`;

    const baseSelectClasses = `
      h-9 w-full rounded-xl border bg-white px-3 text-sm text-neutral-800 shadow-sm shadow-neutral-900/5
      transition-all duration-200 ease-out outline-none
      disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500
      ${
        error
          ? "border-error-300 focus:border-error-500 focus:ring-4 focus:ring-error-100"
          : "border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      }
      ${isFocused ? "shadow-md shadow-neutral-900/10" : ""}
      ${selectClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold leading-5 tracking-[-0.01em] text-neutral-700"
          >
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : description ? descriptionId : undefined
          }
          className={baseSelectClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {children}
        </select>

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

Select.displayName = "Select";