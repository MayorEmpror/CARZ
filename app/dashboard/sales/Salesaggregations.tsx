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




// Salesaggregations.ts
export function getDayHourGrid(sales: Sales[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const s of sales) {
    const dateForDay = new Date(s.purchase_date);
    const dateForHour = new Date(s.created_at as unknown as string); // adjust if Timestamp needs .toDate()
    const day = dateForDay.getDay();
    const hour = dateForHour.getHours();
    if (Number.isNaN(day) || Number.isNaN(hour)) continue;
    grid[day][hour] += 1;
  }
  return grid;
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

function isRevenueCounted(status: string): boolean {
  const s = (status || "").toLowerCase();
  return s !== "cancelled";
}

function toNumber(n: unknown): number {
  const v = typeof n === "number" ? n : parseFloat(String(n));
  return Number.isFinite(v) ? v : 0;
}

export function sum(sales: Sales[]): number {
  return sales.reduce(
    (acc, s) => (isRevenueCounted(s.status) ? acc + toNumber(s.purchase_price) : acc),
    0
  );
}

export function average(sales: Sales[]): number {
  const counted = sales.filter((s) => isRevenueCounted(s.status));
  return counted.length ? sum(counted) / counted.length : 0;
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

export type MonthStatusCell = { count: number; avgPrice: number };

/**
 * Builds a [status][month] grid where each cell carries two independent
 * metrics: order count (drives terrain height) and average purchase price
 * (drives terrain color) — a true 4th dimension on top of month/status/height.
 */
export function getMonthStatusGrid(sales: Sales[]): {
  statuses: string[];
  grid: MonthStatusCell[][]; // grid[statusIdx][month]
} {
  const statusSet = new Set<string>();
  for (const s of sales) statusSet.add(s.status || "unknown");
  const statuses = Array.from(statusSet);

  const count: number[][] = statuses.map(() => new Array(12).fill(0));
  const sumPrice: number[][] = statuses.map(() => new Array(12).fill(0));

  for (const s of sales) {
    const month = toDate(s.purchase_date).getMonth();
    const statusIdx = statuses.indexOf(s.status || "unknown");
    if (statusIdx === -1) continue;
    count[statusIdx][month] += 1;
    sumPrice[statusIdx][month] += s.purchase_price;
  }

  const grid: MonthStatusCell[][] = statuses.map((_, si) =>
    count[si].map((c, mi) => ({
      count: c,
      avgPrice: c ? sumPrice[si][mi] / c : 0,
    }))
  );

  return { statuses, grid };
}