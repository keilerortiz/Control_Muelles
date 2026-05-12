// src/components/ui/Skeleton.jsx
import { forwardRef } from "react";

export const Skeleton = forwardRef(
  (
    {
      className = "h-5 w-full",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "rounded-xl",
      circle: "rounded-full",
      card: "rounded-2xl",
      text: "rounded-md",
    };

    return (
      <div
        ref={ref}
        className={`
          animate-pulse bg-neutral-200/80
          shadow-sm shadow-neutral-900/5
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";