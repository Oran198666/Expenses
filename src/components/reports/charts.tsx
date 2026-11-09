"use client";
// Recharts charts for the Reports screen, styled with the Galactic Odyssey palette.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount } from "@/lib/expenses/constants";

// Palette colors plus lighter / darker shades so 10 categories stay distinct.
export const CHART_COLORS = [
  "#ff66ff", // neon pink
  "#00ffff", // cyan
  "#ffaa33", // amber
  "#a970ff", // light violet
  "#c0c0c0", // silver
  "#ff99ff", // light pink
  "#00b3b3", // deep cyan
  "#ffd08a", // light amber
  "#7b3fb0", // violet
  "#8ce6ff", // ice blue
];

const SILVER = "#c0c0c0";
const GRID = "#4c1c7399";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#111a3a",
    border: "1px solid #ff66ff",
    borderRadius: 8,
    color: "#ffffff",
  },
  labelStyle: { color: "#00ffff" },
  itemStyle: { color: "#ffffff" },
  cursor: { fill: "#4c1c7355" },
};

function compact(value: number): string {
  return value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

export function CategoryPie({
  data,
  currency,
  total,
}: {
  data: { name: string; amount: number }[];
  currency: string;
  total: number;
}) {
  const slices = data.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="h-64" role="img" aria-label="Pie chart of spending by category">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius="35%"
              outerRadius="90%"
              stroke="#0a1128"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => formatAmount(Number(value), currency)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-sm" aria-label="Spending by category">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.fill, boxShadow: `0 0 6px ${s.fill}` }}
            />
            <span className="min-w-0 flex-1 truncate" title={s.name}>
              {s.name}
            </span>
            <span className="whitespace-nowrap text-white">{formatAmount(s.amount, currency)}</span>
            <span className="w-12 text-right text-xs opacity-80">
              {total > 0 ? `${((s.amount / total) * 100).toFixed(1)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ColumnChart({
  data,
  currency,
  color,
  label,
  selected,
  onSelect,
}: {
  data: { label: string; amount: number }[];
  currency: string;
  color: string;
  label: string;
  selected?: string;
  onSelect?: (label: string) => void;
}) {
  const bars = data.map((d) => ({
    ...d,
    fill: selected === undefined || d.label === selected ? color : `${color}77`,
  }));
  return (
    <div className="h-56" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={SILVER}
            tick={{ fill: SILVER, fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={4}
          />
          <YAxis
            stroke={SILVER}
            tick={{ fill: SILVER, fontSize: 12 }}
            tickFormatter={compact}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [formatAmount(Number(value), currency), "Spent"]}
          />
          <Bar
            dataKey="amount"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            isAnimationActive={false}
            style={onSelect ? { cursor: "pointer" } : undefined}
            onClick={onSelect ? (_, index) => onSelect(data[index].label) : undefined}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
