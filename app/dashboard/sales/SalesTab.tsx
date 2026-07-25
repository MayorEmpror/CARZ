"use client";
import { Sales } from "@/lib/types";
import { useMemo } from "react";
import {
  average,
  getCustomerTrend,
  getDayHourGrid,
  getMonthlyTotals,
  getStatusDistribution,
  sum,
  trendPct,
  uniqueCustomerCount,
} from "./Salesaggregations";
import SalesBarChart from "./Salesbarchart";
import SalesDonutChart from "./Salesdonutchart";
import CustomersLineChart from "./Customerslinechart";
import SalesMountainChart from "./mountainchart";

type Props = {
  sales: Sales[];
};

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function TrendBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      {positive ? "↗" : "↘"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function statusBadgeClasses(status: string) {
  const s = status.toLowerCase();
  if (s === "received" || s === "completed") return "bg-emerald-500/15 text-emerald-400";
  if (s === "shipping" || s === "pending") return "bg-amber-500/15 text-amber-400";
  if (s === "cancelled") return "bg-rose-500/15 text-rose-400";
  return "bg-zinc-500/15 text-zinc-300";
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function SalesTab({ sales }: Props) {
  const monthlyTotals = useMemo(() => getMonthlyTotals(sales), [sales]);
  const statusDistribution = useMemo(() => getStatusDistribution(sales), [sales]);
  const customerTrend = useMemo(() => getCustomerTrend(sales), [sales]);
  const dayHourGrid = useMemo(() => getDayHourGrid(sales), [sales]);

  const totalOrders = sales.length;
  const totalSales = sum(sales);
  const avgOrder = average(sales);
  const activeCustomers = uniqueCustomerCount(sales);

  const monthlyOrderCounts = useMemo(() => {
    const counts = new Array(12).fill(0);
    for (const s of sales) counts[new Date(s.purchase_date).getMonth()] += 1;
    return counts;
  }, [sales]);

  const monthlyRevenue = monthlyTotals.map((m) => m.completed + m.pending);
  const monthlyCustomerCounts = customerTrend.map((c) => c.newCustomers + c.returningCustomers);
  const monthlyAvgOrder = monthlyTotals.map((m, i) =>
    monthlyOrderCounts[i] ? (m.completed + m.pending) / monthlyOrderCounts[i] : 0
  );

  const recentOrders = useMemo(
    () =>
      [...sales]
        .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
        .slice(0, 5),
    [sales]
  );

  const busiestSlot = useMemo(() => {
    let maxVal = -1;
    let day = 0;
    let hour = 0;
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (dayHourGrid[d][h] > maxVal) {
          maxVal = dayHourGrid[d][h];
          day = d;
          hour = h;
        }
      }
    }
    return { label: `${DAY_LABELS[day]} ${hour}:00`, count: maxVal };
  }, [dayHourGrid]);

  const statCards = [
    { label: "Total orders", value: totalOrders.toLocaleString(), trend: trendPct(monthlyOrderCounts) },
    { label: "Total sales", value: formatMoney(totalSales), trend: trendPct(monthlyRevenue) },
    { label: "Customers", value: activeCustomers.toLocaleString(), trend: trendPct(monthlyCustomerCounts) },
    { label: "Avg order", value: formatMoney(avgOrder), trend: trendPct(monthlyAvgOrder) },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#08090a] text-white">
      {/* ---------------- BACKGROUND: full-bleed 3D terrain ---------------- */}
      <div className="absolute inset-0 z-0">
        <SalesMountainChart sales={sales} />
      </div>

      {/* ---------------- FOREGROUND UI (floats over the canvas) ---------------- */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">
        {/* -------- TOP BAR (glass) -------- */}
        <header className="pointer-events-auto flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/30 px-6 py-4 backdrop-blur-xl">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-xs text-zinc-300">Check your last activity today</p>
          </div>

          <div className="flex items-center gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md"
              >
                <span className="text-xs text-zinc-300">{card.label}</span>
                <span className="text-sm font-semibold">{card.value}</span>
                <TrendBadge pct={card.trend} />
              </div>
            ))}
          </div>
        </header>

        {/* -------- MIDDLE ROW: label + legend floating top-left/right over canvas -------- */}
        <div className="pointer-events-none flex flex-shrink-0 items-start justify-between px-6 pt-4">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
            <h2 className="text-sm font-semibold">Booking activity terrain</h2>
            <p className="text-xs text-zinc-300">
              Order volume by day of week × hour of day · drag to rotate
            </p>
          </div>

          <div className="pointer-events-auto flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-xl">
              Peak: <span className="font-medium text-white">{busiestSlot.label}</span>{" "}
              <span className="text-zinc-400">({busiestSlot.count} orders)</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-xl">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-zinc-400" /> Low
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5fb0c9]" /> Mid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ffb37a]" /> Peak
              </span>
            </div>
          </div>
        </div>

        {/* -------- spacer: leaves the center of the canvas fully clear for rotating -------- */}
    

        {/* -------- BOTTOM: right sidebar of glass cards, floating -------- */}
        <div className="pointer-events-none flex items-end justify-end p-4 ">
          <aside className="pointer-events-auto max-h-[70vh] w-[360px] overflow-y-auto rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="flex flex-col gap-4">
              {/* Total sales bar chart */}
              <GlassCard className="bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Total sales</h2>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7C7CF0]" /> Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F0876B]" /> Other
                    </span>
                  </div>
                </div>
                <SalesBarChart data={monthlyTotals} />
              </GlassCard>

              {/* Sales distribution donut */}
              <GlassCard className="bg-black/20 p-4">
                <h2 className="mb-3 text-sm font-semibold">Sales distribution</h2>
                <div className="flex flex-col items-center gap-3">
                  <SalesDonutChart data={statusDistribution} />
                  <div className="w-full space-y-1.5">
                    {statusDistribution.map((s, i) => (
                      <div key={s.status} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-zinc-300">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: ["#7C7CF0", "#F0876B", "#F0C86B", "#6BC7F0", "#B26BF0"][i % 5],
                            }}
                          />
                          {s.status}
                        </span>
                        <span className="text-zinc-500">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Customers line chart */}
              <GlassCard className="bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Customers</h2>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7C7CF0]" /> Returning
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F0876B]" /> New
                    </span>
                  </div>
                </div>
                <CustomersLineChart data={customerTrend} />
              </GlassCard>

              {/* Recent orders */}
              <GlassCard className="bg-black/20 p-4">
                <h2 className="mb-3 text-sm font-semibold">Recent orders</h2>
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <div
                      key={order.purchase_id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-white">Car #{order.car_id}</p>
                        <p className="text-zinc-400">
                          {new Date(order.purchase_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatMoney(order.purchase_price)}</p>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </aside>
        </div>


        
      </div>
    </div>
  );
}