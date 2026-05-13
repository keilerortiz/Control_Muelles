// src/components/ui/Radio.jsx
import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

export const Radio = forwardRef(
  (
    {
      label,
      className = "",
      disabled = false,
      error = false,
      description,
      required = false,
      ...props
    }: RadioProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const generatedId = useId();
    const inputId = props.id || `radio-${generatedId}`;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    const baseRadioClass = `
      h-4 w-4 rounded-full border bg-white text-brand-600 shadow-sm shadow-neutral-900/5
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-4 focus:ring-offset-0
      ${
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-70"
          : "cursor-pointer border-neutral-300 hover:border-brand-400 hover:bg-brand-50"
      }
      ${
        error
          ? "border-error-400 focus:border-error-500 focus:ring-error-100"
          : "focus:border-brand-500 focus:ring-brand-100"
      }
      checked:border-brand-600 checked:bg-brand-600
      checked:hover:border-brand-700 checked:hover:bg-brand-700
      disabled:checked:border-brand-300 disabled:checked:bg-brand-300
    `;

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            id={inputId}
            type="radio"
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : description ? descriptionId : undefined
            }
            className={baseRadioClass}
            {...props}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          {label && (
            <label
              htmlFor={inputId}
              className={`text-sm font-semibold leading-5 tracking-[-0.01em] ${
                disabled ? "text-neutral-400" : "text-neutral-700"
              } ${error ? "text-error-700" : ""}`}
            >
              {label}
              {required && <span className="ml-1 text-error-500">*</span>}
            </label>
          )}

          {description && (
            <span
              id={descriptionId}
              className="text-xs leading-4 text-neutral-500"
            >
              {description}
            </span>
          )}

          {error && (
            <span id={errorId} className="text-xs leading-4 text-error-600">
              {error}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = "Radio";

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
  description?: string;
}
