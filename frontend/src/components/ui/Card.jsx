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
      className = "",
      ...props
    },
    ref
  ) => {
    // Variantes de estilo
    const variantClasses = {
      default: "border border-neutral-200 bg-white shadow-sm",
      bordered: "border border-neutral-200 bg-white",
      elevated: "border border-neutral-200 bg-white shadow-md",
      ghost: "bg-transparent",
    };

    // Padding interno
    const paddingClasses = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    // Hover effect
    const hoverClasses = hover ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" : "";

    return (
      <section
        ref={ref}
        className={`rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
        {...props}
      >
        {(title || actions) && (
          <div className={`flex items-center justify-between ${footer ? "border-b border-neutral-200 pb-3 mb-3" : "mb-3"}`}>
            {title && <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>}
            {actions && <div className="flex items-center gap-1">{actions}</div>}
          </div>
        )}
        <div className={footer ? "mb-3" : ""}>{children}</div>
        {footer && (
          <div className="border-t border-neutral-200 pt-3 mt-2">
            <div className="text-sm text-neutral-600">{footer}</div>
          </div>
        )}
      </section>
    );
  }
);

Card.displayName = "Card";