import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useApiQuery } from "@/hooks/use-api";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "@/lib/types";

export const Route = createFileRoute("/_shell/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — NovaPOS" },
      { name: "description", content: "A full trail of user actions across the system." },
    ],
  }),
  component: AuditLogsPage,
});

function userName(log: AuditLog) {
  if (typeof log.user === "object" && log.user) return log.user.name;
  return log.userId ?? "System";
}

function AuditLogsPage() {
  const logs = useApiQuery<AuditLog[]>(["audit-logs"], "/audit-logs");

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Who did what, and when — across every module."
      />

      <QueryState
        query={logs}
        emptyIcon={ClipboardList}
        emptyTitle="No activity logged yet"
        emptyDescription="User actions like logins, edits and sales will be tracked here."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{userName(log)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.entity ?? "—"}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {log.details ?? "—"}
                    </TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>
    </div>
  );
}
