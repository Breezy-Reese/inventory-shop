import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_shell/customers")({
  head: () => ({
    meta: [
      { title: "Customers — NovaPOS" },
      { name: "description", content: "Customer directory with loyalty and spend history." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useApiQuery<Customer[]>(["customers"], "/customers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const create = useApiMutation("/customers", {
    invalidate: [["customers"]],
    successMessage: "Customer added",
    onSuccess: () => {
      setOpen(false);
      setForm({ name: "", email: "", phone: "", address: "" });
    },
  });

  const remove = useApiMutation<{ id: string }>((i) => `/customers/${i.id}`, {
    method: "DELETE",
    invalidate: [["customers"]],
    successMessage: "Customer deleted",
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Directory, loyalty points and lifetime spend."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!form.name || create.isPending}
                  onClick={() =>
                    create.mutate({
                      name: form.name,
                      email: form.email || undefined,
                      phone: form.phone || undefined,
                      address: form.address || undefined,
                    })
                  }
                >
                  {create.isPending ? "Saving…" : "Add customer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <QueryState
        query={customers}
        emptyIcon={Users}
        emptyTitle="No customers yet"
        emptyDescription="Add customers to track loyalty points and purchase history."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Loyalty pts</TableHead>
                  <TableHead className="text-right">Total spent</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="tabular-numbers">{c.phone || "—"}</TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {c.loyaltyPoints !== undefined ? formatNumber(c.loyaltyPoints) : "—"}
                    </TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {c.totalSpent !== undefined ? formatMoney(c.totalSpent) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate({ id: c._id })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
