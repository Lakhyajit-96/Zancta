"use client";
import * as React from "react";

/**
 * @deprecated This component is no longer used. Button patterns are now implemented inline across the codebase.
 * Will be removed in a future cleanup.
 */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base = "premium-button focus-visible:ring-2 ring-accent disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "premium-button-primary",
    ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
    outline: "premium-button-secondary",
  };
  const sizes: Record<string, string> = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-10 px-5 text-sm",
    lg: "min-h-12 px-7 text-base",
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
