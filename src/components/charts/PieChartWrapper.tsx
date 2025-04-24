"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";

interface PieChartWrapperProps {
  data: Record<string, unknown>[] | null;
}

// Define a base set of chart colors
const BASE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  // Add more if needed, e.g., using different hues or lightness
  "var(--chart-1) / 0.7",
  "var(--chart-2) / 0.7",
];

export function PieChartWrapper({ data }: PieChartWrapperProps) {
  // --- MOVED HOOKS BEFORE EARLY RETURNS ---

  // Basic data validation needed for key inference before hooks
  const isValidData =
    data &&
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null;
  const keys = isValidData ? Object.keys(data[0]!) : [];
  const hasEnoughKeys = keys.length >= 2;

  // --- Infer Keys (logic depends on data validity) ---
  let categoryKey = keys[0] || "category"; // Default if no keys
  let valueKey = keys[1] || "value"; // Default if no keys

  if (hasEnoughKeys) {
    const potentialCategoryKeys = ["name", "label", "category", "id"];
    const potentialValueKeys = [
      "value",
      "count",
      "total",
      "amount",
      "percentage",
      "share",
    ];

    const foundCategory = keys.find((k) =>
      potentialCategoryKeys.includes(k.toLowerCase())
    );
    const foundValue = keys.find(
      (k) => potentialValueKeys.includes(k.toLowerCase()) && k !== foundCategory
    );

    if (foundCategory) categoryKey = foundCategory;
    if (foundValue) valueKey = foundValue;

    if (categoryKey === valueKey) {
      valueKey = keys.find((k) => k !== categoryKey) || keys[1];
    }
  }
  // ----------------------------------

  // --- Generate Dynamic Chart Config and Data for Pie ---
  const chartData = useMemo(() => {
    // Return empty array if data is invalid to avoid hook errors
    if (!isValidData) return [];
    return data.map((item, index) => ({
      name: String(item[categoryKey] ?? `Item ${index + 1}`),
      value: Number(item[valueKey] ?? 0),
      fill: BASE_CHART_COLORS[index % BASE_CHART_COLORS.length],
    }));
    // Add hasEnoughKeys dependency? No, keys won't change if data structure is same
  }, [data, categoryKey, valueKey, isValidData]); // Include isValidData in dependency array

  const dynamicChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    // Use chartData which is already memoized and handles invalid data
    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    config[valueKey] = { label: valueKey };
    return config;
    // Use chartData dependency as it incorporates data/key validity
  }, [chartData, valueKey]);
  // --------------------------------------------------

  // --- NOW PERFORM EARLY RETURNS ---
  if (!isValidData) {
    return (
      <p className="text-muted-foreground text-sm">
        No data available for pie chart.
      </p>
    );
  }

  if (!hasEnoughKeys) {
    return (
      <p className="text-muted-foreground text-sm">
        Data needs at least two fields for a pie chart.
      </p>
    );
  }
  // -------------------------------

  return (
    <div className="mt-4">
      <ChartContainer
        config={dynamicChartConfig}
        className="mx-auto aspect-square max-h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie
              data={chartData} // Use the memoized chartData
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {/* Use the memoized chartData here too */}
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
