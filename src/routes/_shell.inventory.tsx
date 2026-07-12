import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownUp, Boxes, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDateTime, formatNumber } from "@/lib/format";
import type { InventoryItem, StockMovement } from "@/lib/types";

export const Route = createFileRoute("/_shell/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — NovaPOS" },
      { name: "description", content: "Stock levels, adjustments and movement history." },
    ],
  }),
  component: InventoryPage,
});

function itemName(item: InventoryItem) {
  if (item.name) return item.name;
  if (typeof item.product === "object" && item.product) return item.product.name;
  return item.productId;
}

function movementProduct(m: StockMovement) {
  if (typeof m.product === "object" && m.product) return m.product.name;
  return m.productId;
}

function InventoryPage() {
  const inventory = useApiQuery<InventoryItem[]>(["inventory"], "/inventory");
  const movements = useApiQuery<StockMovement[]>(["inventory", "movements"], "/inventory/movements");

  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const adjust = useApiMutation("/inventory/adjustments", {
    invalidate: [["inventory"], ["products"]],
    successMessage: "Stock adjusted",
    onSuccess: () => {
      setAdjusting(null);
      setQuantity("");
      setReason("");
    },
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock levels, make adjustments and review movements."
      />

      <Tabs defaultValue="stock">
        <TabsList className="mb-4">
          <TabsTrigger value="stock">Stock levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <QueryState
            query={inventory}
            emptyIcon={Boxes}
            emptyTitle="No inventory records yet"
            emptyDescription="Stock appears here once products are received via purchases or adjustments."
          >
            {(data) => (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const low =
                        item.lowStockThreshold !== undefined &&
                        item.quantity <= item.lowStockThreshold;
                      return (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">{itemName(item)}</TableCell>
                          <TableCell className="tabular-numbers">{item.sku ?? "—"}</TableCell>
                          <TableCell className="tabular-numbers text-right">
                            {formatNumber(item.quantity)}
                          </TableCell>
                          <TableCell>
                            {low ? (
                              <Badge className="border-warning/30 bg-warning/15 text-warning-foreground">
                                Low stock
                              </Badge>
                            ) : (
                              <Badge className="border-success/30 bg-success/15 text-success">
                                In stock
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAdjusting(item)}
                            >
                              <SlidersHorizontal className="size-3.5" /> Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="movements">
          <QueryState
            query={movements}
            emptyIcon={ArrowDownUp}
            emptyTitle="No stock movements yet"
            emptyDescription="Every stock in, out, adjustment and transfer is logged here."
          >
            {(data) => (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium">{movementProduct(m)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-numbers text-right">
                          {formatNumber(m.quantity)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.reason ?? "—"}</TableCell>
                        <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </QueryState>
        </TabsContent>
      </Tabs>

      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust stock{adjusting ? ` — ${itemName(adjusting)}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Quantity change (use negative to remove)</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10 or -3"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Damaged goods, stocktake correction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjusting(null)}>
              Cancel
            </Button>
            <Button
              disabled={!quantity || adjust.isPending}
              onClick={() =>
                adjusting &&
                adjust.mutate({
                  productId: adjusting.productId,
                  quantity: Number(quantity),
                  reason: reason || undefined,
                })
              }
            >
              {adjust.isPending ? "Saving…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
