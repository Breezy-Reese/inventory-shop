import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Minus,
  PackageSearch,
  Plus,
  ScanBarcode,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/hooks/use-api";
import { formatMoney } from "@/lib/format";
import type { Customer, PaymentMethod, Product } from "@/lib/types";

export const Route = createFileRoute("/_shell/pos")({
  head: () => ({
    meta: [
      { title: "Point of Sale — NovaPOS" },
      { name: "description", content: "Fast checkout with barcode search, discounts and receipts." },
    ],
  }),
  component: PosPage,
});

interface CartLine {
  product: Product;
  quantity: number;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mobile", label: "Mobile", icon: Smartphone },
  { value: "credit", label: "On account", icon: Wallet },
];

function PosPage() {
  const products = useApiQuery<Product[]>(["products"], "/products");
  const customers = useApiQuery<Customer[]>(["customers"], "/customers");

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState<string>("");

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

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product._id === product._id);
      if (existing) {
        return prev.map((l) =>
          l.product._id === product._id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product._id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const subtotal = cart.reduce((sum, l) => sum + l.product.sellingPrice * l.quantity, 0);
  const discount = (subtotal * discountPct) / 100;
  const tax = ((subtotal - discount) * taxPct) / 100;
  const total = subtotal - discount + tax;

  const checkout = useApiMutation("/sales", {
    invalidate: [["sales"], ["reports"], ["inventory"], ["products"]],
    successMessage: "Sale completed",
    onSuccess: () => {
      setCart([]);
      setDiscountPct(0);
      setCustomerId("");
    },
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    checkout.mutate({
      customerId: customerId || undefined,
      items: cart.map((l) => ({
        productId: l.product._id,
        name: l.product.name,
        sku: l.product.sku,
        quantity: l.quantity,
        unitPrice: l.product.sellingPrice,
        total: l.product.sellingPrice * l.quantity,
      })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: payment,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Product picker */}
      <div className="min-w-0">
        <div className="relative mb-4">
          <ScanBarcode className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Scan barcode or search name / SKU…"
            className="pl-9"
            autoFocus
          />
        </div>

        {products.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : products.isError ? (
          <EmptyState
            variant="error"
            title="Backend not connected"
            description={`${products.error.message} Expected endpoint: GET /api/products`}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={search ? "No matching products" : "No products yet"}
            description={
              search
                ? "Try a different name, SKU or barcode."
                : "Add products in the Products page to start selling."
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                className="group rounded-xl border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-sm"
              >
                <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {p.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{p.sku}</p>
                <p className="mt-2 font-display text-sm font-semibold">
                  {formatMoney(p.sellingPrice)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <Card className="h-fit lg:sticky lg:top-20">
        <CardContent className="space-y-4 p-4">
          <h2 className="font-display text-base font-semibold">Current sale</h2>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tap products to add them to the cart.
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.product._id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(l.product.sellingPrice)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => updateQty(l.product._id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-7 text-center text-sm">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => updateQty(l.product._id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <span className="tabular-numbers w-16 text-right">
                    {formatMoney(l.product.sellingPrice * l.quantity)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => updateQty(l.product._id, -l.quantity)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs">Tax %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Customer (optional)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Walk-in customer" />
              </SelectTrigger>
              <SelectContent>
                {(customers.data ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Payment method</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPayment(m.value)}
                  className={
                    payment === m.value
                      ? "flex flex-col items-center gap-1 rounded-lg border border-primary bg-primary/10 p-2 text-xs font-medium text-primary"
                      : "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs text-muted-foreground transition-colors hover:border-primary/50"
                  }
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-numbers">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="tabular-numbers">-{formatMoney(discount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-numbers">{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkout.isPending}
          >
            {checkout.isPending ? "Processing…" : `Charge ${formatMoney(total)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
