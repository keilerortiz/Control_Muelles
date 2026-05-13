import { forwardRef, useId, useState } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
  textareaClassName?: string;
}

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      description,
      required = false,
      disabled = false,
      rows = 3,
      className = "",
      textareaClassName = "",
      ...props
    }: TextareaProps,
    ref: React.ForwardedRef<HTMLTextAreaElement>
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const textareaId = props.id || `textarea-${generatedId}`;
    const errorId = `${textareaId}-error`;
    const descriptionId = `${textareaId}-description`;

    const baseTextareaClasses = `
      w-full rounded-2xl border bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm shadow-neutral-900/5
      transition-all duration-200 ease-out outline-none resize-none
      placeholder:text-neutral-400
      disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500
      ${
        error
          ? "border-error-300 focus:border-error-500 focus:ring-4 focus:ring-error-100"
          : "border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      }
      ${isFocused ? "shadow-md shadow-neutral-900/10" : ""}
      ${textareaClassName}
    `;

    return (
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold leading-5 tracking-[-0.01em] text-neutral-700"
          >
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : description ? descriptionId : undefined
          }
          className={baseTextareaClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

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

Textarea.displayName = "Textarea";
