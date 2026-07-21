import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { PublicCategory, PublicProduct } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop — NovaPOS" },
      { name: "description", content: "Browse products and order online." },
    ],
  }),
  component: ShopPage,
});

interface CartLine {
  product: PublicProduct;
  quantity: number;
}

function ProductCard({
  product,
  onAdd,
}: {
  product: PublicProduct;
  onAdd: (p: PublicProduct) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="aspect-square w-full bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Store className="size-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-sm font-semibold">{formatMoney(product.price)}</span>
          {!product.inStock && (
            <Badge variant="outline" className="text-muted-foreground">
              Out of stock
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={!product.inStock}
          onClick={() => onAdd(product)}
        >
          <Plus className="size-3.5" /> Add to cart
        </Button>
      </div>
    </div>
  );
}

function ShopPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const productsRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderNumber: string; total: number } | null>(
    null,
  );

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    fulfillmentType: "pickup" as "pickup" | "delivery",
    deliveryAddress: "",
    notes: "",
  });

  const categories = useQuery<PublicCategory[], ApiError>({
    queryKey: ["public-categories"],
    queryFn: () => api<PublicCategory[]>("/public/categories"),
    retry: false,
  });

  const products = useQuery<PublicProduct[], ApiError>({
    queryKey: ["public-products", categoryId, search],
    queryFn: () =>
      api<PublicProduct[]>(
        `/public/products?${new URLSearchParams({
          ...(categoryId !== "all" ? { category: categoryId } : {}),
          ...(search ? { q: search } : {}),
        }).toString()}`,
      ),
    retry: false,
  });

  const addToCart = (product: PublicProduct) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product._id === product._id);
      if (existing) {
        return prev.map((l) =>
          l.product._id === product._id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product._id === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product._id !== productId));
  };

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.quantity * l.product.price, 0);

  const canPlaceOrder =
    cart.length > 0 &&
    form.customerName.trim() &&
    form.customerPhone.trim() &&
    (form.fulfillmentType === "pickup" || form.deliveryAddress.trim());

  const placeOrder = async () => {
    if (!canPlaceOrder) return;
    setPlacing(true);
    try {
      const res = await api<{ orderNumber: string; total: number }>("/public/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          fulfillmentType: form.fulfillmentType,
          deliveryAddress: form.fulfillmentType === "delivery" ? form.deliveryAddress : undefined,
          notes: form.notes || undefined,
          items: cart.map((l) => ({ productId: l.product._id, quantity: l.quantity })),
        }),
      });
      setConfirmation(res);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't place order");
    } finally {
      setPlacing(false);
    }
  };

  const filtered = useMemo(() => products.data ?? [], [products.data]);

  const scrollToProducts = (nextCategoryId?: string) => {
    if (nextCategoryId !== undefined) setCategoryId(nextCategoryId);
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4.5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold leading-tight">NovaPOS Shop</p>
              <p className="text-xs text-muted-foreground">Browse &amp; order online</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setCartOpen(true)} className="relative">
            <ShoppingCart className="size-4" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -right-2 -top-2 size-5 justify-center rounded-full p-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <p className="font-display text-2xl font-semibold sm:text-4xl">
            Everything you need, a click away
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            Browse our full catalog, add what you like to your cart, and order online for pickup or
            delivery.
          </p>
          <Button size="lg" className="mt-6" onClick={() => scrollToProducts()}>
            Browse products <ArrowRight className="size-4" />
          </Button>
        </div>

        {(categories.data ?? []).length > 0 && (
          <div className="mx-auto max-w-6xl px-4 pb-10">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Shop by category</p>
            <div className="flex flex-wrap gap-2.5">
              {(categories.data ?? []).map((c) => (
                <button
                  key={c._id}
                  onClick={() => scrollToProducts(c._id)}
                  className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <main ref={productsRef} className="mx-auto max-w-6xl scroll-mt-4 px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {products.isPending && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        )}

        {products.isError && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">Store is unavailable right now</p>
            <p className="mt-1 text-sm text-muted-foreground">{products.error.message}</p>
          </div>
        )}

        {!products.isPending && !products.isError && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="font-medium">No products found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or category.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} onAdd={addToCart} />
          ))}
        </div>
      </main>

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <p className="flex-1 px-4 text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto px-4">
              {cart.map((l) => (
                <div key={l.product._id} className="flex items-center gap-3 rounded-lg border p-2">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {l.product.imageUrl && (
                      <img
                        src={l.product.imageUrl}
                        alt={l.product.name}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(l.product.price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6"
                      onClick={() => changeQty(l.product._id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-4 text-center text-sm tabular-nums">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6"
                      onClick={() => changeQty(l.product._id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(l.product._id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <SheetFooter className="flex-col gap-3 sm:flex-col">
            <div className="flex w-full items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span className="font-display text-base">{formatMoney(cartTotal)}</span>
            </div>
            <Button
              className="w-full"
              disabled={cart.length === 0}
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Checkout
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Checkout drawer */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Checkout</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 px-4">
            <div>
              <Label>Full name</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Phone number</Label>
              <Input
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">Fulfillment</Label>
              <RadioGroup
                value={form.fulfillmentType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, fulfillmentType: v as "pickup" | "delivery" }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="font-normal">
                    Pickup in store
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="font-normal">
                    Delivery
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {form.fulfillmentType === "delivery" && (
              <div>
                <Label>Delivery address</Label>
                <Textarea
                  rows={2}
                  value={form.deliveryAddress}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter className="flex-col gap-3 sm:flex-col">
            <div className="flex w-full items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span className="font-display text-base">{formatMoney(cartTotal)}</span>
            </div>
            <Button className="w-full" disabled={!canPlaceOrder || placing} onClick={placeOrder}>
              {placing ? "Placing order…" : "Place order"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Order confirmation */}
      <Sheet open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Order placed 🎉</SheetTitle>
          </SheetHeader>
          {confirmation && (
            <div className="space-y-2 px-4 text-sm">
              <p>
                Order <span className="font-medium">{confirmation.orderNumber}</span> has been
                placed for {formatMoney(confirmation.total)}.
              </p>
              <p className="text-muted-foreground">
                Save your order number and phone number — you can use them to check your order
                status any time.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}