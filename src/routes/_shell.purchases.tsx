import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArchiveRestore, PackageCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Product, Purchase, Supplier } from "@/lib/types";

export const Route = createFileRoute("/_shell/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases — NovaPOS" },
      { name: "description", content: "Supplier orders and goods receiving." },
    ],
  }),
  component: PurchasesPage,
});

interface DraftLine {
  productId: string;
  quantity: number;
  unitCost: number;
}

function supplierName(p: Purchase, suppliers: Supplier[]) {
  if (typeof p.supplier === "object" && p.supplier) return p.supplier.name;
  return suppliers.find((s) => s._id === p.supplierId)?.name ?? "—";
}

const statusStyles: Record<string, string> = {
  received: "border-success/30 bg-success/15 text-success",
  pending: "border-warning/30 bg-warning/15 text-warning-foreground",
  ordered: "border-info/30 bg-info/15 text-info",
  cancelled: "border-destructive/30 bg-destructive/15 text-destructive",
};

function PurchasesPage() {
  const purchases = useApiQuery<Purchase[]>(["purchases"], "/purchases");
  const suppliers = useApiQuery<Supplier[]>(["suppliers"], "/suppliers");
  const products = useApiQuery<Product[]>(["products"], "/products");

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [lineProduct, setLineProduct] = useState("");
  const [lineQty, setLineQty] = useState("1");
  const [lineCost, setLineCost] = useState("");

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  const addLine = () => {
    if (!lineProduct || !Number(lineQty)) {
      toast.error("Pick a product and quantity");
      return;
    }
    setLines((prev) => [
      ...prev,
      { productId: lineProduct, quantity: Number(lineQty), unitCost: Number(lineCost) || 0 },
    ]);
    setLineProduct("");
    setLineQty("1");
    setLineCost("");
  };

  const create = useApiMutation("/purchases", {
    invalidate: [["purchases"], ["inventory"], ["products"]],
    successMessage: "Purchase order created",
    onSuccess: () => {
      setOpen(false);
      setSupplierId("");
      setLines([]);
    },
  });

  const receive = useApiMutation<{ id: string }>((i) => `/purchases/${i.id}/receive`, {
    invalidate: [["purchases"], ["inventory"], ["products"]],
    successMessage: "Purchase marked as received",
  });

  const productName = (id: string) =>
    (products.data ?? []).find((p) => p._id === id)?.name ?? id;

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Order stock from suppliers and receive goods."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>New purchase order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {(suppliers.data ?? []).map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">Line items</p>
                  {lines.length > 0 && (
                    <ul className="mb-3 space-y-1.5">
                      {lines.map((l, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="truncate">
                            {productName(l.productId)} × {l.quantity}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="tabular-numbers">
                              {formatMoney(l.quantity * l.unitCost)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setLines((prev) => prev.filter((_, idx) => idx !== i))
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid grid-cols-[1fr_70px_90px_auto] items-end gap-2">
                    <div>
                      <Label className="text-xs">Product</Label>
                      <Select value={lineProduct} onValueChange={setLineProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {(products.data ?? []).map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={lineQty}
                        onChange={(e) => setLineQty(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit cost</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={lineCost}
                        onChange={(e) => setLineCost(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={addLine}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-right text-sm">
                  Total: <span className="font-display font-semibold">{formatMoney(total)}</span>
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!supplierId || lines.length === 0 || create.isPending}
                  onClick={() =>
                    create.mutate({
                      supplierId,
                      items: lines.map((l) => ({ ...l, total: l.quantity * l.unitCost })),
                      total,
                      status: "ordered",
                    })
                  }
                >
                  {create.isPending ? "Saving…" : "Create order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <QueryState
        query={purchases}
        emptyIcon={ArchiveRestore}
        emptyTitle="No purchase orders yet"
        emptyDescription="Create a purchase order to restock from a supplier."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="tabular-numbers">
                      {p.referenceNumber ?? p._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {supplierName(p, suppliers.data ?? [])}
                    </TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {formatNumber(p.items?.length ?? 0)}
                    </TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {formatMoney(p.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${statusStyles[p.status] ?? "bg-secondary text-secondary-foreground"}`}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      {p.status !== "received" && p.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={receive.isPending}
                          onClick={() => receive.mutate({ id: p._id })}
                        >
                          <PackageCheck className="size-3.5" /> Receive
                        </Button>
                      )}
                    </TableCell>
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
