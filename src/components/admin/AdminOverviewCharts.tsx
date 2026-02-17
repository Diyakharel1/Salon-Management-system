"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SENTIMENT_COLORS = { positive: "#10b981", neutral: "#f59e0b", negative: "#ef4444" };

type DayPoint = { date: string; bookings: number; sales: number };

type Props = {
  bookingsByDay: DayPoint[];
  salesByDay: DayPoint[];
  sentimentCounts: { positive: number; neutral: number; negative: number };
};

export function AdminOverviewCharts({ bookingsByDay, salesByDay, sentimentCounts }: Props) {
  const sentimentData = [
    { name: "Positive", value: sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
    { name: "Neutral", value: sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral },
    { name: "Negative", value: sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Bookings trend */}
      <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
        <h3 className="font-semibold text-stone-900">Bookings (last 7 days)</h3>
        <p className="mt-0.5 text-sm text-stone-500">Daily appointment count</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingsByDay}>
              <defs>
                <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
              <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number | undefined) => [value ?? 0, "Bookings"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="#d97706"
                strokeWidth={2}
                fill="url(#bookingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales trend */}
      <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
        <h3 className="font-semibold text-stone-900">Sales (last 7 days)</h3>
        <p className="mt-0.5 text-sm text-stone-500">NPR revenue per day</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
              <YAxis tick={{ fontSize: 12 }} stroke="#78716c" tickFormatter={(v) => `NPR ${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : "0", "Sales (NPR)"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="sales" fill="#d97706" radius={[6, 6, 0, 0]} name="Sales (NPR)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment pie */}
      <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur lg:col-span-2">
        <h3 className="font-semibold text-stone-900">Feedback sentiment</h3>
        <p className="mt-0.5 text-sm text-stone-500">Distribution of review sentiment</p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="h-64 w-full max-w-xs">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e7e5e4",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-stone-50 text-sm text-stone-500">
                No feedback data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
