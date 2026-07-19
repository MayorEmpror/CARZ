"use client";
import { Sales } from "@/lib/types";
import { useMemo } from "react";
import {
  average,
  getCustomerTrend,
  getMonthlyTotals,
  getStatusDistribution,
  sum,
  trendPct,
  uniqueCustomerCount,
} from "./Salesaggregations";
import Sparkline from "./Sparkline";
import SalesBarChart from "./Salesbarchart";
import SalesDonutChart from "./Salesdonutchart";
import CustomersLineChart from "./Customerslinechart";

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

export default function SalesTab({ sales }: Props) {
  const monthlyTotals = useMemo(() => getMonthlyTotals(sales), [sales]);
  const statusDistribution = useMemo(() => getStatusDistribution(sales), [sales]);
  const customerTrend = useMemo(() => getCustomerTrend(sales), [sales]);

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
        .sort(
          (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
        )
        .slice(0, 5),
    [sales]
  );

  const statCards = [
    {
      label: "Total orders",
      value: totalOrders.toLocaleString(),
      trend: trendPct(monthlyOrderCounts),
      spark: monthlyOrderCounts,
      color: "#7C7CF0",
      light: true,
    },
    {
      label: "Total sales",
      value: formatMoney(totalSales),
      trend: trendPct(monthlyRevenue),
      spark: monthlyRevenue,
      color: "#F0876B",
      light: false,
    },
    {
      label: "Active customers",
      value: activeCustomers.toLocaleString(),
      trend: trendPct(monthlyCustomerCounts),
      spark: monthlyCustomerCounts,
      color: "#F0C86B",
      light: false,
    },
    {
      label: "Average order",
      value: formatMoney(avgOrder),
      trend: trendPct(monthlyAvgOrder),
      spark: monthlyAvgOrder,
      color: "#F0876B",
      light: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-3xl bg-[#141416] p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">Check your last activity today</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl p-5 ${
                card.light ? "bg-white text-black" : "bg-[#1c1c1f] text-white"
              }`}
            >
              <p className={`mb-2 text-sm ${card.light ? "text-zinc-600" : "text-zinc-400"}`}>
                {card.label}
              </p>
              <div className="flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold">{card.value}</span>
                <Sparkline data={card.spark} color={card.light ? "#7C7CF0" : card.color} />
              </div>
              <div className="mt-2">
                <TrendBadge pct={card.trend} />
              </div>
            </div>
          ))}
        </div>

        {/* Sales chart + distribution */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-[#1c1c1f] p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Total sales</h2>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7C7CF0]" /> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F0876B]" /> Other
                </span>
              </div>
            </div>
            <SalesBarChart data={monthlyTotals} />
          </div>

          <div className="rounded-2xl bg-[#1c1c1f] p-6">
            <h2 className="mb-4 text-lg font-semibold">Sales distribution</h2>
            <div className="flex flex-col items-center gap-4">
              <SalesDonutChart data={statusDistribution} />
              <div className="w-full space-y-2">
                {statusDistribution.map((s, i) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: ["#7C7CF0", "#F0876B", "#F0C86B", "#6BC7F0", "#B26BF0"][
                            i % 5
                          ],
                        }}
                      />
                      {s.status}
                    </span>
                    <span className="text-zinc-500">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders + customers */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-[#1c1c1f] p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent orders</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-500">
                  <th className="pb-3 font-normal">Car</th>
                  <th className="pb-3 font-normal">Date</th>
                  <th className="pb-3 font-normal">Price</th>
                  <th className="pb-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.purchase_id} className="border-t border-zinc-800">
                    <td className="py-3">Car #{order.car_id}</td>
                    <td className="py-3 text-zinc-400">
                      {new Date(order.purchase_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">{formatMoney(order.purchase_price)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-[#1c1c1f] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Customers</h2>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7C7CF0]" /> Returning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F0876B]" /> New
                </span>
              </div>
            </div>
            <CustomersLineChart data={customerTrend} />
          </div>
        </div>
      </div>
    </div>
  );
}