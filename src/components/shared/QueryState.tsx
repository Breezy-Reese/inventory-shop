import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import type { ApiError } from "@/lib/api";

interface QueryStateProps<T> {
  query: UseQueryResult<T, ApiError>;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}

export function QueryState<T>({
  query,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  isEmpty,
  children,
}: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        variant="error"
        title="Backend not connected"
        description={query.error.message}
      />
    );
  }

  const data = query.data as T;
  const empty = isEmpty
    ? isEmpty(data)
    : Array.isArray(data)
      ? data.length === 0
      : false;

  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children(data)}</>;
}
