"use client";

import type { CSSProperties } from "react";
import { Toaster } from "@/components/ui/sonner";

// Styled Toaster from 21st.dev "Sonner Toast" (isaiahbjork/primitive-sonner).
// The --bjork-* tokens are not defined in this project, so each falls back to a shadcn token.
export function StyledToaster(props: React.ComponentProps<typeof Toaster>) {
  return (
    <Toaster
      style={
        {
          "--normal-bg": "var(--bjork-field, var(--popover))",
          "--normal-text": "var(--bjork-text, var(--popover-foreground))",
          "--normal-border": "var(--bjork-border, var(--border))",
        } as CSSProperties
      }
      toastOptions={{
        style: {
          background: "var(--bjork-field, var(--popover))",
          border: "1px solid var(--bjork-border, var(--border))",
          color: "var(--bjork-text, var(--popover-foreground))",
          borderRadius: "18px",
          boxShadow: "var(--bjork-shadow-surface, 0 4px 12px rgb(0 0 0 / 0.15))",
        },
        classNames: {
          toast:
            "rounded-[18px] border border-[color:var(--bjork-border,var(--border))] bg-[var(--bjork-field,var(--popover))] px-4 py-4 text-[color:var(--bjork-text,var(--popover-foreground))]",
          title: "text-sm font-medium text-[color:var(--bjork-text-strong,var(--foreground))]",
          description:
            "text-sm leading-6 text-[color:var(--bjork-text-muted,var(--muted-foreground))]",
        },
      }}
      {...props}
    />
  );
}

export default StyledToaster;
