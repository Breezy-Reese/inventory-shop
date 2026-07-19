import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/_shell/orders")({
  head: () => ({
    meta: [
      { title: "Orders — NovaPOS" },
      { name: "description", content: "Online orders placed by customers." },
    ],
  }),
  component: OrdersPage,
});

const statusStyles: Record<string, string> = {
  fulfilled: "border-success/30 bg-success/15 text-success",
  pending: "border-warning/30 bg-warning/15 text-warning-foreground",
  confirmed: "border-info/30 bg-info/15 text-info",
  cancelled: "border-destructive/30 bg-destructive/15 text-destructive",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "fulfilled",
};

function OrdersPage() {
  const orders = useApiQuery<Order[]>(["orders"], "/orders");

  const updateStatus = useApiMutation<{ id: string; status: OrderStatus }>(
    (i) => `/orders/${i.id}/status`,
    {
      method: "PUT",
      invalidate: [["orders"], ["inventory"], ["products"], ["sales"], ["reports"]],
      successMessage: "Order updated",
    },
  );

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Orders placed by customers through the online storefront."
      />

      <QueryState
        query={orders}
        emptyIcon={ShoppingBag}
        emptyTitle="No online orders yet"
        emptyDescription="Orders placed through the customer storefront will show up here."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="w-48" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((o) => {
                  const advanceTo = nextStatus[o.status as OrderStatus];
                  const isFinal = o.status === "fulfilled" || o.status === "cancelled";
                  return (
                    <TableRow key={o._id}>
                      <TableCell className="tabular-numbers">
                        {o.orderNumber ?? o._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customerName}</div>
                        <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {o.fulfillmentType ?? "pickup"}
                        {o.deliveryAddress && (
                          <div className="max-w-[16rem] truncate text-xs text-muted-foreground">
                            {o.deliveryAddress}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="tabular-numbers text-right">
                        {formatNumber(o.items?.length ?? 0)}
                      </TableCell>
                      <TableCell className="tabular-numbers text-right">
                        {formatMoney(o.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`capitalize ${statusStyles[o.status] ?? "bg-secondary text-secondary-foreground"}`}
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                      <TableCell>
                        {!isFinal && (
                          <div className="flex items-center gap-2">
                            {advanceTo && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateStatus.isPending}
                                onClick={() =>
                                  updateStatus.mutate({ id: o._id, status: advanceTo })
                                }
                              >
                                <CheckCircle2 className="size-3.5" />
                                Mark {advanceTo}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={updateStatus.isPending}
                              onClick={() =>
                                updateStatus.mutate({ id: o._id, status: "cancelled" })
                              }
                            >
                              <XCircle className="size-3.5" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>
    </div>
  );
}