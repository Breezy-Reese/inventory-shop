import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
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
import type { Supplier } from "@/lib/types";

export const Route = createFileRoute("/_shell/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — NovaPOS" },
      { name: "description", content: "Supplier directory for purchasing and restocking." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const suppliers = useApiQuery<Supplier[]>(["suppliers"], "/suppliers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "" });

  const create = useApiMutation("/suppliers", {
    invalidate: [["suppliers"]],
    successMessage: "Supplier added",
    onSuccess: () => {
      setOpen(false);
      setForm({ name: "", contactPerson: "", email: "", phone: "", address: "" });
    },
  });

  const remove = useApiMutation<{ id: string }>((i) => `/suppliers/${i.id}`, {
    method: "DELETE",
    invalidate: [["suppliers"]],
    successMessage: "Supplier deleted",
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendors you order and receive stock from."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Company name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact person</Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      contactPerson: form.contactPerson || undefined,
                      email: form.email || undefined,
                      phone: form.phone || undefined,
                      address: form.address || undefined,
                    })
                  }
                >
                  {create.isPending ? "Saving…" : "Add supplier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <QueryState
        query={suppliers}
        emptyIcon={Truck}
        emptyTitle="No suppliers yet"
        emptyDescription="Add suppliers to create purchase orders against them."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contactPerson || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email || "—"}</TableCell>
                    <TableCell className="tabular-numbers">{s.phone || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove.mutate({ id: s._id })}
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
