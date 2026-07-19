import { Sales } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export type MonthlyTotal = {
  month: string;
  completed: number; // "online" series in the UI
  pending: number;   // "offline" series in the UI
};

export type StatusSlice = {
  status: string;
  count: number;
};

export type CustomerTrendPoint = {
  month: string;
  newCustomers: number;
  returningCustomers: number;
};

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

/**
 * Splits monthly revenue into two series so the bar chart can mirror the
 * "online vs offline" look of the reference design. There's no online/offline
 * flag on Sales, so we bucket by status instead:
 *   - "completed" / "received"  -> first bar (purple)
 *   - everything else (shipping, pending, cancelled, ...) -> second bar (orange)
 */
export function getMonthlyTotals(sales: Sales[]): MonthlyTotal[] {
  const buckets = MONTHS.map((month) => ({ month, completed: 0, pending: 0 }));

  for (const sale of sales) {
    const date = toDate(sale.purchase_date);
    const idx = date.getMonth();
    const status = (sale.status || "").toLowerCase();
    if (status === "completed" || status === "received") {
      buckets[idx].completed += sale.purchase_price;
    } else {
      buckets[idx].pending += sale.purchase_price;
    }
  }

  return buckets;
}

export function getStatusDistribution(sales: Sales[]): StatusSlice[] {
  const counts = new Map<string, number>();
  for (const sale of sales) {
    const status = sale.status || "unknown";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

/**
 * A customer counts as "new" the month of their first-ever purchase in the
 * dataset, and "returning" for every purchase after that.
 */
export function getCustomerTrend(sales: Sales[]): CustomerTrendPoint[] {
  const sorted = [...sales].sort(
    (a, b) => toDate(a.purchase_date).getTime() - toDate(b.purchase_date).getTime()
  );

  const seen = new Set<number>();
  const buckets = MONTHS.map((month) => ({ month, newCustomers: 0, returningCustomers: 0 }));

  for (const sale of sorted) {
    const date = toDate(sale.purchase_date);
    const idx = date.getMonth();
    if (seen.has(sale.customer_id)) {
      buckets[idx].returningCustomers += 1;
    } else {
      seen.add(sale.customer_id);
      buckets[idx].newCustomers += 1;
    }
  }

  return buckets;
}

export function sum(sales: Sales[]): number {
  return sales.reduce((acc, s) => acc + s.purchase_price, 0);
}

export function average(sales: Sales[]): number {
  return sales.length ? sum(sales) / sales.length : 0;
}

export function uniqueCustomerCount(sales: Sales[]): number {
  return new Set(sales.map((s) => s.customer_id)).size;
}

/** Percent change of the last month's value vs. the prior month, for badges. */
export function trendPct(values: number[]): number {
  if (values.length < 2) return 0;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (prev === 0) return last === 0 ? 0 : 100;
  return ((last - prev) / prev) * 100;
}