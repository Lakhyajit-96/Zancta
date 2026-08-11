"use client";
import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:ring-2 ring-accent disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-accent text-accent-foreground hover:opacity-90 rounded-md",
    ghost: "bg-transparent hover:bg-muted text-foreground rounded-md",
    outline: "border border-border bg-transparent hover:bg-muted rounded-md",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-7 text-base",
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
