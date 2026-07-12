import type { LucideIcon } from "lucide-react";
import { PlugZap } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "error";
}

export function EmptyState({
  icon: Icon = PlugZap,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div
        className={
          variant === "error"
            ? "flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning"
            : "flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        }
      >
        <Icon className="size-6" />
      </div>
      <div className="space-y-1 px-6">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
