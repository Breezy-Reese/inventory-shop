import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { Settings } from "@/lib/types";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NovaPOS" },
      { name: "description", content: "Store profile, tax and receipt configuration." },
    ],
  }),
  component: SettingsPage,
});

const empty: Settings = {
  storeName: "",
  currency: "USD",
  taxRate: 0,
  receiptFooter: "",
  lowStockThreshold: 5,
  address: "",
  phone: "",
  email: "",
};

function SettingsPage() {
  const settings = useApiQuery<Settings>(["settings"], "/settings");
  const [form, setForm] = useState<Settings>(empty);

  useEffect(() => {
    if (settings.data) setForm({ ...empty, ...settings.data });
  }, [settings.data]);

  const save = useApiMutation("/settings", {
    method: "PUT",
    invalidate: [["settings"]],
    successMessage: "Settings saved",
  });

  if (settings.isPending) {
    return (
      <div>
        <PageHeader title="Settings" description="Store profile, tax and receipt configuration." />
        <Skeleton className="h-96 max-w-2xl rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Store profile, tax and receipt configuration." />

      {settings.isError && (
        <div className="mb-4 flex max-w-2xl items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span>
            Couldn't load saved settings ({settings.error.message}). You can still edit below —
            saving requires PUT /api/settings.
          </span>
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Store profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Store name</Label>
            <Input
              value={form.storeName ?? ""}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            />
          </div>
          <div>
            <Label>Currency code</Label>
            <Input
              value={form.currency ?? ""}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              placeholder="USD"
            />
          </div>
          <div>
            <Label>Default tax rate %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.taxRate ?? 0}
              onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Low-stock alert threshold</Label>
            <Input
              type="number"
              min={0}
              value={form.lowStockThreshold ?? 0}
              onChange={(e) =>
                setForm({ ...form, lowStockThreshold: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Receipt footer message</Label>
            <Textarea
              rows={2}
              value={form.receiptFooter ?? ""}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
              placeholder="Thank you for shopping with us!"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
