import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Boxes, LineChart as LineChartIcon, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useApiQuery } from "@/hooks/use-api";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Expense, InventoryItem, ProfitPoint, RevenuePoint } from "@/lib/types";

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports — NovaPOS" },
      { name: "description", content: "Sales, inventory, profit and expense reports." },
    ],
  }),
  component: ReportsPage,
});

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ReportsPage() {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const range = `?from=${from}&to=${to}`;

  const salesReport = useApiQuery<RevenuePoint[]>(
    ["reports", "sales", from, to],
    `/reports/sales${range}`,
  );
  const profitReport = useApiQuery<ProfitPoint[]>(
    ["reports", "profit", from, to],
    `/reports/profit${range}`,
  );
  const inventoryReport = useApiQuery<InventoryItem[]>(
    ["reports", "inventory"],
    "/reports/inventory",
  );
  const expensesReport = useApiQuery<Expense[]>(
    ["reports", "expenses", from, to],
    `/reports/expenses${range}`,
  );

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business performance across sales, profit, stock and expenses."
        actions={
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        }
      />

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <QueryState
            query={salesReport}
            emptyIcon={BarChart3}
            emptyTitle="No sales in this period"
            emptyDescription="Adjust the date range or record sales through the POS."
          >
            {(data) => (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue by day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={48} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.date}</TableCell>
                            <TableCell className="tabular-numbers text-right">
                              {r.orders !== undefined ? formatNumber(r.orders) : "—"}
                            </TableCell>
                            <TableCell className="tabular-numbers text-right">
                              {formatMoney(r.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="profit">
          <QueryState
            query={profitReport}
            emptyIcon={LineChartIcon}
            emptyTitle="No profit data in this period"
            emptyDescription="Profit is computed from sales revenue minus product cost."
          >
            {(data) => (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue vs cost vs profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={48} />
                        <Tooltip />
                        <Line dataKey="revenue" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
                        <Line dataKey="cost" stroke="var(--chart-4)" dot={false} strokeWidth={2} />
                        <Line dataKey="profit" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="inventory">
          <QueryState
            query={inventoryReport}
            emptyIcon={Boxes}
            emptyTitle="No inventory data"
            emptyDescription="Stock valuation appears once inventory is recorded."
          >
            {(data) => (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.name ??
                            (typeof item.product === "object" && item.product
                              ? item.product.name
                              : item.productId)}
                        </TableCell>
                        <TableCell className="tabular-numbers">{item.sku ?? "—"}</TableCell>
                        <TableCell className="tabular-numbers text-right">
                          {formatNumber(item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </QueryState>
        </TabsContent>

        <TabsContent value="expenses">
          <QueryState
            query={expensesReport}
            emptyIcon={Wallet}
            emptyTitle="No expenses in this period"
            emptyDescription="Recorded business expenses will be listed here."
          >
            {(data) => (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((e) => (
                      <TableRow key={e._id}>
                        <TableCell className="font-medium capitalize">
                          {e.category ?? "General"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.note ?? "—"}</TableCell>
                        <TableCell className="tabular-numbers text-right">
                          {formatMoney(e.amount)}
                        </TableCell>
                        <TableCell>{formatDate(e.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </QueryState>
        </TabsContent>
      </Tabs>
    </div>
  );
}
