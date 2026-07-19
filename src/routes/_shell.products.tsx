import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MoreHorizontal, Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatMoney, formatNumber } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export const Route = createFileRoute("/_shell/products")({
  head: () => ({
    meta: [
      { title: "Products — NovaPOS" },
      { name: "description", content: "Manage your product catalog, SKUs, barcodes and pricing." },
    ],
  }),
  component: ProductsPage,
});

const emptyForm = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  categoryId: "",
  costPrice: "",
  sellingPrice: "",
  unit: "pcs",
  lowStockThreshold: "5",
  imageUrl: "",
};

function ProductsPage() {
  const products = useApiQuery<Product[]>(["products"], "/products");
  const categories = useApiQuery<Category[]>(["categories"], "/categories");

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      categoryId: p.categoryId ?? "",
      costPrice: String(p.costPrice ?? ""),
      sellingPrice: String(p.sellingPrice ?? ""),
      unit: p.unit ?? "pcs",
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      imageUrl: p.imageUrl ?? "",
    });
    setOpen(true);
  };

  const save = useApiMutation<Record<string, unknown>>(
    (input) => (editing ? `/products/${editing._id}` : "/products"),
    {
      method: editing ? "PUT" : "POST",
      invalidate: [["products"]],
      successMessage: editing ? "Product updated" : "Product created",
      onSuccess: () => setOpen(false),
    },
  );

  const remove = useApiMutation<{ id: string }>((input) => `/products/${input.id}`, {
    method: "DELETE",
    invalidate: [["products"]],
    successMessage: "Product deleted",
  });

  const filtered = useMemo(() => {
    const list = products.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [products.data, search]);

  const categoryName = (p: Product) => {
    if (typeof p.category === "object" && p.category) return p.category.name;
    const found = (categories.data ?? []).find((c) => c._id === p.categoryId);
    return found?.name ?? "—";
  };

  const submit = () => {
    save.mutate({
      name: form.name,
      description: form.description || undefined,
      sku: form.sku,
      barcode: form.barcode || undefined,
      categoryId: form.categoryId || undefined,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      unit: form.unit,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      imageUrl: form.imageUrl || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog, SKUs, barcodes and pricing."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Add product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    placeholder="Shown to customers on the online storefront"
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Image URL</Label>
                  <div className="flex items-start gap-3">
                    <Input
                      placeholder="https://…"
                      value={form.imageUrl}
                      onChange={(e) => set("imageUrl")(e.target.value)}
                    />
                    {form.imageUrl && (
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="size-9 shrink-0 rounded-md border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used on the product list and the customer storefront.
                  </p>
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={(e) => set("sku")(e.target.value)} />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input value={form.barcode} onChange={(e) => set("barcode")(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={set("categoryId")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories.data ?? []).map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => set("costPrice")(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Selling price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => set("sellingPrice")(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={(e) => set("unit")(e.target.value)} />
                </div>
                <div>
                  <Label>Low-stock alert at</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.lowStockThreshold}
                    onChange={(e) => set("lowStockThreshold")(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={!form.name || save.isPending}>
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, SKU or barcode…"
          className="pl-9"
        />
      </div>

      <QueryState
        query={products}
        emptyIcon={Package}
        emptyTitle="No products yet"
        emptyDescription="Create your first product to build the catalog."
      >
        {() => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const low =
                    p.stock !== undefined &&
                    p.lowStockThreshold !== undefined &&
                    p.stock <= p.lowStockThreshold;
                  return (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="size-8 shrink-0 rounded-md border object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                              <Package className="size-3.5" />
                            </div>
                          )}
                          {p.name}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-numbers">{p.sku || "—"}</TableCell>
                      <TableCell>{categoryName(p)}</TableCell>
                      <TableCell className="tabular-numbers text-right">
                        {formatMoney(p.costPrice)}
                      </TableCell>
                      <TableCell className="tabular-numbers text-right">
                        {formatMoney(p.sellingPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.stock === undefined ? (
                          "—"
                        ) : low ? (
                          <Badge className="bg-warning/15 text-warning-foreground border-warning/30">
                            {formatNumber(p.stock)} low
                          </Badge>
                        ) : (
                          <span className="tabular-numbers">{formatNumber(p.stock)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => remove.mutate({ id: p._id })}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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