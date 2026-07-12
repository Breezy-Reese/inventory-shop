import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Sale } from "@/lib/types";

export const Route = createFileRoute("/_shell/sales")({
  head: () => ({
    meta: [
      { title: "Sales — NovaPOS" },
      { name: "description", content: "Sales history, receipts and payment details." },
    ],
  }),
  component: SalesPage,
});

function customerName(s: Sale) {
  if (typeof s.customer === "object" && s.customer) return s.customer.name;
  return s.customerId ? "Customer" : "Walk-in";
}

function SalesPage() {
  const sales = useApiQuery<Sale[]>(["sales"], "/sales");
  const [viewing, setViewing] = useState<Sale | null>(null);

  return (
    <div>
      <PageHeader title="Sales" description="Every transaction recorded through the POS." />

      <QueryState
        query={sales}
        emptyIcon={Receipt}
        emptyTitle="No sales yet"
        emptyDescription="Completed POS transactions will appear here with receipts."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow
                    key={s._id}
                    className="cursor-pointer"
                    onClick={() => setViewing(s)}
                  >
                    <TableCell className="tabular-numbers">
                      {s.receiptNumber ?? s._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{customerName(s)}</TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {s.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {formatMoney(s.total)}
                    </TableCell>
                    <TableCell className="capitalize">{s.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.status === "refunded" || s.status === "void"
                            ? "border-destructive/30 bg-destructive/15 text-destructive capitalize"
                            : "border-success/30 bg-success/15 text-success capitalize"
                        }
                      >
                        {s.status ?? "completed"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(s.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Receipt {viewing?.receiptNumber ?? viewing?._id.slice(-6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {formatDateTime(viewing.createdAt)} · {customerName(viewing)} ·{" "}
                <span className="capitalize">{viewing.paymentMethod}</span>
              </p>
              <Separator />
              <ul className="space-y-1.5">
                {viewing.items?.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="tabular-numbers">{formatMoney(item.total)}</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-numbers">{formatMoney(viewing.subtotal)}</span>
                </div>
                {!!viewing.discount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-numbers">-{formatMoney(viewing.discount)}</span>
                  </div>
                )}
                {!!viewing.tax && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="tabular-numbers">{formatMoney(viewing.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 font-display text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(viewing.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
