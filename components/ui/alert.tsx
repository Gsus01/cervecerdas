import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const icons: Record<"error" | "success", LucideIcon> = {
  error: AlertCircle,
  success: CheckCircle2,
};

interface AlertProps extends ComponentProps<"div"> {
  variant?: "error" | "success";
}

export function Alert({
  className,
  variant = "error",
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-5",
        variant === "error" &&
          "border-destructive/25 bg-destructive/5 text-destructive",
        variant === "success" &&
          "border-emerald-700/20 bg-emerald-50 text-emerald-900",
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
      <div>{children}</div>
    </div>
  );
}
