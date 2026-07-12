import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api";
import { formatMoney, formatNumber } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";

export const Route = createFileRoute("/_shell/")({
  component: DashboardPage,
});

function DashboardPage() {
  const summary = useApiQuery<DashboardSummary>(["reports", "summary"], "/reports/summary");
  const data = summary.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live overview of sales, stock and customers."
        actions={
          <Button asChild>
            <Link to="/pos">
              <ShoppingCart className="size-4" /> Open POS
            </Link>
          </Button>
        }
      />

      {summary.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : summary.isError ? (
        <EmptyState
          variant="error"
          title="Backend not connected"
          description={`${summary.error.message} Expected endpoint: GET /api/reports/summary`}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's revenue"
              value={formatMoney(data?.todayRevenue ?? 0)}
              icon={Banknote}
            />
            <StatCard
              label="Today's sales"
              value={formatNumber(data?.todaySalesCount ?? 0)}
              icon={Receipt}
            />
            <StatCard
              label="Products"
              value={formatNumber(data?.totalProducts ?? 0)}
              icon={Package}
              hint={
                data?.lowStockCount
                  ? `${formatNumber(data.lowStockCount)} low on stock`
                  : undefined
              }
            />
            <StatCard
              label="Customers"
              value={formatNumber(data?.totalCustomers ?? 0)}
              icon={Users}
            />
          </div>

          {!!data?.lowStockCount && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span>
                {formatNumber(data.lowStockCount)} product(s) are running low.{" "}
                <Link to="/inventory" className="font-medium underline underline-offset-2">
                  Review inventory
                </Link>
              </span>
            </div>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Revenue (last 30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.revenueByDay && data.revenueByDay.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={48} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No sales data yet"
                    description="Revenue will chart here once sales are recorded through the POS."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top products</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topProducts && data.topProducts.length > 0 ? (
                  <ul className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <li key={p.productId ?? i} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(p.quantity)} sold
                          </p>
                        </div>
                        <span className="tabular-numbers">{formatMoney(p.revenue)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={Package}
                    title="No bestsellers yet"
                    description="Top-selling products will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
