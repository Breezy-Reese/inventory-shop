import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, PackageSearch, Store, Tags } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";
import type { Order, PublicCategory } from "@/lib/types";

interface ShopSidebarProps {
  categories: PublicCategory[];
  activeCategoryId: string;
  onSelectCategory: (categoryId?: string) => void;
}

function TrackOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const lookup = async () => {
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const result = await api<Order>(
        `/public/orders/track?${new URLSearchParams({ orderNumber, phone }).toString()}`,
      );
      setOrder(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't find that order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setOrder(null);
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Track your order</DialogTitle>
          <DialogDescription>
            Enter the order number and phone number you used at checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Order number</Label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-123456"
            />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button className="w-full" disabled={loading} onClick={lookup}>
            {loading ? "Looking up…" : "Check status"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {order && (
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{order.orderNumber}</span>
                <Badge className="capitalize">{order.status}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                {formatMoney(order.total)} · placed {formatDateTime(order.createdAt)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShopSidebar({ categories, activeCategoryId, onSelectCategory }: ShopSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [trackOpen, setTrackOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Store className="size-4.5" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">
                  NovaPOS Shop
                </p>
                <p className="text-[11px] text-sidebar-foreground/70">Browse &amp; order online</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeCategoryId === "all"}
                    tooltip="All products"
                    onClick={() => onSelectCategory("all")}
                  >
                    <Tags />
                    <span>All products</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {categories.map((c) => (
                  <SidebarMenuItem key={c._id}>
                    <SidebarMenuButton
                      isActive={activeCategoryId === c._id}
                      tooltip={c.name}
                      onClick={() => onSelectCategory(c._id)}
                    >
                      <Tags />
                      <span>{c.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>My orders</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Track an order" onClick={() => setTrackOpen(true)}>
                    <PackageSearch />
                    <span>Track an order</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Staff sign in">
                <Link to="/auth">
                  <LogIn />
                  <span>Staff sign in</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <TrackOrderDialog open={trackOpen} onOpenChange={setTrackOpen} />
    </>
  );
}