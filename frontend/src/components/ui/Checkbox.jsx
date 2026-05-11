// src/components/ui/Checkbox.jsx
import { forwardRef, useId } from "react";

export const Checkbox = forwardRef(
  (
    {
      label,
      error,
      description,
      required = false,
      disabled = false,
      className = "",
      inputClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = props.id || `checkbox-${generatedId}`;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    // Clases del checkbox
    const baseCheckboxClass = `
      h-4 w-4 rounded border transition-all duration-200
      focus:ring-2 focus:ring-offset-0 focus:outline-none
      ${disabled 
        ? "cursor-not-allowed bg-neutral-100 border-neutral-300" 
        : "cursor-pointer border-neutral-300 bg-white hover:border-brand-300"
      }
      ${error 
        ? "border-error-400 focus:ring-error-300" 
        : "focus:ring-brand-300 focus:border-brand-500"
      }
      checked:bg-brand-600 checked:border-brand-600 checked:ring-2 checked:ring-brand-200
      disabled:checked:bg-brand-300 disabled:checked:border-brand-300
      ${inputClassName}
    `;

    return (
      <div className={`flex items-start gap-2 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : description ? descriptionId : undefined}
            className={baseCheckboxClass}
            {...props}
          />
        </div>
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={inputId}
              className={`text-sm font-medium ${
                disabled ? "text-neutral-400" : "text-neutral-700"
              } ${error ? "text-error-700" : ""}`}
            >
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </label>
          )}
          {description && (
            <span id={descriptionId} className="text-xs text-neutral-500">{description}</span>
          )}
          {error && <span id={errorId} className="text-xs text-error-600">{error}</span>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
