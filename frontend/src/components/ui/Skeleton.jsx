// src/components/ui/Skeleton.jsx
import { forwardRef } from "react";

export const Skeleton = forwardRef(({ className = "h-5 w-full", variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full",
    card: "rounded-xl",
    text: "rounded",
  };

  return (
    <div
      ref={ref}
      className={`animate-pulse bg-neutral-200 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";