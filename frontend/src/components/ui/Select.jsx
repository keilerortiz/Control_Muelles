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
      w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800
      transition-all duration-200 outline-none
      disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
      ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"}
      ${isFocused ? "shadow-sm" : ""}
      ${selectClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : description ? descriptionId : undefined}
          className={baseSelectClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {children}
        </select>
        {description && !error && (
          <p id={descriptionId} className="text-xs text-slate-500">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
