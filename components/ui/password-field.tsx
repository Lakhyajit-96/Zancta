"use client";

import * as React from "react";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="field-input h-11 pr-16"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint}
    </div>
  );
}
