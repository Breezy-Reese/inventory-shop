import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatDate, formatNumber } from "@/lib/format";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/_shell/categories")({
  head: () => ({
    meta: [
      { title: "Categories — NovaPOS" },
      { name: "description", content: "Organize products into categories." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const categories = useApiQuery<Category[]>(["categories"], "/categories");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = useApiMutation("/categories", {
    invalidate: [["categories"]],
    successMessage: "Category created",
    onSuccess: () => {
      setOpen(false);
      setName("");
      setDescription("");
    },
  });

  const remove = useApiMutation<{ id: string }>((i) => `/categories/${i.id}`, {
    method: "DELETE",
    invalidate: [["categories"]],
    successMessage: "Category deleted",
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group products for faster browsing and reporting."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New category</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => create.mutate({ name, description: description || undefined })}
                  disabled={!name || create.isPending}
                >
                  {create.isPending ? "Saving…" : "Create category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <QueryState
        query={categories}
        emptyIcon={Tags}
        emptyTitle="No categories yet"
        emptyDescription="Create categories like Beverages, Snacks or Electronics."
      >
        {(data) => (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {c.description || "—"}
                    </TableCell>
                    <TableCell className="tabular-numbers text-right">
                      {c.productCount !== undefined ? formatNumber(c.productCount) : "—"}
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
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
