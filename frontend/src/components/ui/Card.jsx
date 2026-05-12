// src/components/ui/Card.jsx
import { forwardRef } from "react";

export const Card = forwardRef(
  (
    {
      title,
      children,
      actions,
      footer,
      variant = "default", // 'default', 'bordered', 'elevated', 'ghost'
      padding = "md", // 'none', 'sm', 'md', 'lg'
      hover = false,
      contentClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    // Variantes de estilo
    const variantClasses = {
      default:
        "border border-neutral-200 bg-white shadow-sm shadow-neutral-900/5",
      bordered:
        "border border-neutral-200 bg-white",
      elevated:
        "border border-neutral-200 bg-white shadow-md shadow-neutral-900/10",
      ghost:
        "border border-transparent bg-transparent",
    };

    // Padding interno
    const paddingClasses = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    };

    // Hover effect
    const hoverClasses = hover
      ? "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-900/10"
      : "";

    return (
      <section
        ref={ref}
        className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
        {...props}
      >
        {(title || actions) && (
          <div
            className={`flex items-center justify-between gap-3 ${
              footer
                ? "mb-3 border-b border-neutral-200 pb-3"
                : "mb-3"
            }`}
          >
            {title && (
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">
                {title}
              </h3>
            )}

            {actions && (
              <div className="flex shrink-0 items-center gap-1.5">
                {actions}
              </div>
            )}
          </div>
        )}

        <div
          className={`${footer ? "mb-3" : ""} ${contentClassName}`.trim()}
        >
          {children}
        </div>

        {footer && (
          <div className="mt-3 border-t border-neutral-200 pt-3">
            <div className="text-sm leading-relaxed text-neutral-500">
              {footer}
            </div>
          </div>
        )}
      </section>
    );
  }
);

Card.displayName = "Card";