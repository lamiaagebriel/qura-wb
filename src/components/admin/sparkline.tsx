"use client";

import { Area, AreaChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useLocale } from "@/lib/i18n/provider";

/**
 * A stat card's 30-day trend: one series (no legend: the card names it),
 * a 2px line over a faint fill, no grid or axis lines, and a crosshair
 * tooltip with the day and its count. `color` follows what's counted
 * (the same color as its section).
 */
export function Sparkline({
  data,
  label,
  color,
}: {
  data: { day: string; value: number }[];
  label: string;
  color: string;
}) {
  const { locale } = useLocale();
  const config = { value: { label, color } } satisfies ChartConfig;
  const day = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" });

  return (
    <ChartContainer config={config} className="aspect-auto h-14 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="day" hide />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltipContent indicator="line" labelFormatter={(value) => day(String(value))} />}
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="var(--color-value)"
          fillOpacity={0.12}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
