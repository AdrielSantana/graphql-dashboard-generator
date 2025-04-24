"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"; // Direct import from recharts
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig, // Often needed for color config
} from "@/components/ui/chart";

interface LineChartWrapperProps {
  data: Record<string, unknown>[] | null;
}

export function LineChartWrapper({ data }: LineChartWrapperProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No data available for line chart.
      </p>
    );
  }

  // Basic check for data structure
  if (typeof data[0] !== "object" || data[0] === null) {
    return (
      <p className="text-muted-foreground text-sm">Invalid data format.</p>
    );
  }

  const keys = Object.keys(data[0]);
  if (keys.length < 2) {
    return (
      <p className="text-muted-foreground text-sm">
        Data needs at least two fields for a line chart.
      </p>
    );
  }

  // --- Infer Keys (similar logic to BarChart) ---
  let categoryKey = keys[0]; // Default
  let valueKey = keys[1]; // Default

  const potentialCategoryKeys = [
    "date",
    "timestamp",
    "time",
    "month",
    "year",
    "name",
    "label",
    "category",
    "id",
  ];
  const potentialValueKeys = [
    "value",
    "count",
    "total",
    "amount",
    "score",
    "temperature",
    "price",
  ];

  const foundCategory = keys.find((k) =>
    potentialCategoryKeys.includes(k.toLowerCase())
  );
  const foundValue = keys.find(
    (k) => potentialValueKeys.includes(k.toLowerCase()) && k !== foundCategory
  );

  if (foundCategory) categoryKey = foundCategory;
  if (foundValue) valueKey = foundValue;

  // Ensure different keys if possible
  if (categoryKey === valueKey && keys.length > 1) {
    valueKey = keys.find((k) => k !== categoryKey) || keys[1];
  }
  // -------------------------------------------

  // Build dynamic chart config
  const dynamicChartConfig: ChartConfig = {
    [valueKey]: {
      label: valueKey,
      color: "var(--chart-1)", // Use updated --chart-1
    },
  };

  return (
    <div className="mt-4">
      <ChartContainer
        config={dynamicChartConfig}
        className="min-h-[200px] w-full"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke={dynamicChartConfig[valueKey]?.color || "var(--chart-1)"}
              strokeWidth={2}
              dot={false}
              name={String(dynamicChartConfig[valueKey]?.label || valueKey)}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
