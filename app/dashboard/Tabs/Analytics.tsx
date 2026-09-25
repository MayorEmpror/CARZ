// components/AnalyticsTab.tsx
"use client"

import { useMemo } from "react"
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ZAxis
} from "recharts"

type Car = {
  car_id: number
  owner_id: number
  make: string
  model: string
  year: number
  body_type: string
  fuel_type: string
  transmission: string
  price: string
  status: string
  created_at: string
  rating: string
  rating_count: number
}

const COLORS = ["#6366f1", "#22d3ee", "#f472b6", "#facc15", "#34d399", "#fb923c", "#a78bfa", "#f87171"]

function groupCount(cars: Car[], key: keyof Car) {
  const map = new Map<string, number>()
  for (const c of cars) {
    const k = String(c[key])
    map.set(k, (map.get(k) || 0) + 1)
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
      {title && <h3 className="text-sm text-white/60 mb-5">{title}</h3>}
      {children}
    </div>
  )
}

const tooltipStyle = { background: "#111827", border: "1px solid #ffffff20", borderRadius: 8, padding: "8px 12px" }

export default function AnalyticsTab({ cars }: { cars: Car[] }) {
  const stats = useMemo(() => {
    const prices = cars.map((c) => parseFloat(c.price)).filter((n) => !isNaN(n))
    const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgRating = cars.reduce((a, c) => a + parseFloat(c.rating || "0"), 0) / (cars.length || 1)
    const totalReviews = cars.reduce((a, c) => a + (c.rating_count || 0), 0)
    const uniqueOwners = new Set(cars.map((c) => c.owner_id)).size
    const avgYear = cars.reduce((a, c) => a + c.year, 0) / (cars.length || 1)

    const bodyType = groupCount(cars, "body_type")
    const fuelType = groupCount(cars, "fuel_type")
    const transmission = groupCount(cars, "transmission")
    const makeCount = groupCount(cars, "make")
    const topMakes = makeCount.slice(0, 8)

    const priceByBodyType = bodyType.map(({ name }) => {
      const subset = cars.filter((c) => c.body_type === name)
      const avg = subset.reduce((a, c) => a + parseFloat(c.price), 0) / subset.length
      return { name, avgPrice: Math.round(avg) }
    })

    const ratingByFuelType = fuelType.map(({ name }) => {
      const subset = cars.filter((c) => c.fuel_type === name)
      const avg = subset.reduce((a, c) => a + parseFloat(c.rating || "0"), 0) / subset.length
      return { name, avgRating: Number(avg.toFixed(2)) }
    })

    const byYear = new Map<number, number>()
    for (const c of cars) byYear.set(c.year, (byYear.get(c.year) || 0) + 1)
    const inventoryByYear = [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: String(year), count }))

    const priceVsRating = cars
      .map((c) => ({
        price: parseFloat(c.price),
        rating: parseFloat(c.rating || "0"),
        reviews: c.rating_count || 0,
      }))
      .filter((d) => !isNaN(d.price) && !isNaN(d.rating))

    const ownerCount = groupCount(cars, "owner_id").map((o) => ({ name: `Owner ${o.name}`, value: o.value }))

    // price buckets/histogram
    const bucketSize = Math.ceil((maxPrice - minPrice) / 8) || 1
    const buckets = Array.from({ length: 8 }, (_, i) => {
      const lo = minPrice + i * bucketSize
      const hi = lo + bucketSize
      const count = prices.filter((p) => p >= lo && p < hi).length
      return { range: `${(lo / 1e6).toFixed(1)}M`, count }
    })

    const topRated = [...cars]
      .filter((c) => c.rating_count > 0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating) || b.rating_count - a.rating_count)
      .slice(0, 6)

    return {
      total: cars.length,
      avgPrice, minPrice, maxPrice, avgRating, totalReviews, uniqueOwners, avgYear,
      bodyType, fuelType, transmission, topMakes,
      priceByBodyType, ratingByFuelType, inventoryByYear, priceVsRating,
      ownerCount, buckets, topRated,
    }
  }, [cars])

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 })

  const cardStats = [
    { label: "Total Listings", value: fmt(stats.total) },
    { label: "Avg. Price", value: fmt(stats.avgPrice) },
    { label: "Price Range", value: `${fmt(stats.minPrice)} – ${fmt(stats.maxPrice)}` },
    { label: "Avg. Rating", value: stats.avgRating.toFixed(2) },
    { label: "Total Reviews", value: fmt(stats.totalReviews) },
    { label: "Unique Owners", value: fmt(stats.uniqueOwners) },
    { label: "Avg. Model Year", value: stats.avgYear.toFixed(0) },
  ]

  return (
    <div className="text-white p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-3xl font-semibold">Analytics</h2>
        <p className="text-white/50 text-sm mt-1">Live breakdown of current fleet listings</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {cardStats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-white/50">{s.label}</div>
            <div className="text-xl font-semibold mt-2">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Body Type Mix">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.bodyType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {stats.bodyType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Fuel Type">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.fuelType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {stats.fuelType.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Transmission">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.transmission} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {stats.transmission.map((_, i) => <Cell key={i} fill={COLORS[(i + 5) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Avg. Price by Body Type">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.priceByBodyType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avgPrice" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top Makes by Listing Count">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.topMakes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#ffffff60" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#ffffff60" fontSize={11} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Avg. Rating by Fuel Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.ratingByFuelType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
              <YAxis domain={[0, 5]} stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avgRating" fill="#facc15" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Price Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="range" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f472b6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Price vs. Rating">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" dataKey="rating" name="Rating" domain={[3, 5]} stroke="#ffffff60" fontSize={11} />
              <YAxis type="number" dataKey="price" name="Price" stroke="#ffffff60" fontSize={11} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
              <ZAxis type="number" dataKey="reviews" range={[20, 200]} name="Reviews" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={stats.priceVsRating} fill="#a78bfa" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Inventory by Model Year">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.inventoryByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="year" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Listings per Owner">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats.ownerCount}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#fb923c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top Rated Listings">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topRated.map((c) => (
            <div key={c.car_id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.make} {c.model}</span>
                <span className="text-yellow-400 text-sm">★ {c.rating}</span>
              </div>
              <div className="text-white/50 text-xs mt-1">{c.year} · {c.body_type} · {c.fuel_type}</div>
              <div className="text-white/70 text-sm mt-2">{fmt(parseFloat(c.price))}</div>
              <div className="text-white/40 text-xs mt-1">{c.rating_count} reviews</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}