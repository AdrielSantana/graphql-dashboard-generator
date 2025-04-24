"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  //   Tooltip, // Keep for potential direct use if needed
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  //   ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
// REMOVED: Unused import
// import { FieldMapping } from "@/app/api/graphql/route";

interface BarChartWrapperProps {
  data: Record<string, unknown>[] | null;
  // REMOVED: fieldMapping: FieldMapping;
}

// REMOVED: Static chartConfig

export function BarChartWrapper({ data }: BarChartWrapperProps) {
  // Dynamic key inference and config generation logic added previously...
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No data available for bar chart.
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
        Data needs at least two fields for a bar chart.
      </p>
    );
  }

  // Try to infer category and value keys
  let categoryKey =
    keys.find((key) => typeof data[0]?.[key] === "string") || keys[0];
  let valueKey =
    keys.find((key) => typeof data[0]?.[key] === "number") ||
    keys.find((key) => key !== categoryKey) ||
    keys[1];

  const potentialCategoryKeys = [
    "name",
    "label",
    "category",
    "id",
    "date",
    "timestamp",
  ];
  const potentialValueKeys = ["value", "count", "total", "amount", "score"];

  const foundCategory = keys.find((k) =>
    potentialCategoryKeys.includes(k.toLowerCase())
  );
  const foundValue = keys.find(
    (k) => potentialValueKeys.includes(k.toLowerCase()) && k !== foundCategory
  );

  if (foundCategory) categoryKey = foundCategory;
  if (foundValue) valueKey = foundValue;

  if (categoryKey === valueKey && keys.length > 1) {
    valueKey = keys.find((k) => k !== categoryKey) || keys[1];
  }

  // Build chart config dynamically
  const dynamicChartConfig: ChartConfig = {
    [valueKey]: {
      label: valueKey,
      color: "var(--chart-1)", // Use direct var()
    },
  };

  return (
    <div className="mt-4">
      {/* {title && (
        <h4 className="font-semibold mb-2 text-sm text-center">{title}</h4>
      )} */}
      {/* REMOVED: Title is now handled by the parent Card */}
      <ChartContainer
        config={dynamicChartConfig}
        className="min-h-[200px] w-full"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // tickFormatter={(value) => value.slice(0, 3)} // Example formatter
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false} // Use default cursor
              content={<ChartTooltipContent hideLabel />}
            />
            <Legend content={<ChartLegendContent />} />
            <Bar
              dataKey={valueKey}
              fill={dynamicChartConfig[valueKey]?.color || "var(--chart-1)"}
              radius={4}
              name={String(dynamicChartConfig[valueKey]?.label || valueKey)}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
