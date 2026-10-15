"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <div
          onClick={() => !disabled && onCheckedChange?.(!checked)}
          className={cn(
            "size-4 shrink-0 rounded-sm border border-primary/50 shadow-2xs transition-colors cursor-pointer flex items-center justify-center",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted/40",
            className
          )}
        >
          {checked && <Check className="size-3 text-current stroke-[3]" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
