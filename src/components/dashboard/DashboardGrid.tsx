"use client";

import React from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VisualizationSuggestion } from "@/app/api/graphql/route";
import { DashboardItemCard } from "./DashboardItemCard";

// Type matching the state structure in page.tsx
// Ensure this matches the one in page.tsx or move to a shared types file
interface DashboardItem {
  id: string;
  queryResultData: Record<string, unknown> | null;
  visualizationSuggestion: VisualizationSuggestion | null;
  suggestedTitle?: string;
  generatedQuery?: string | null;
}

interface DashboardGridProps {
  layouts: Layouts;
  items: DashboardItem[];
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void;
  onRemoveItem: (id: string) => void;
  // Pass the render function down
  renderVisualization: (
    data: Record<string, unknown> | null,
    suggestion: VisualizationSuggestion | null
  ) => React.ReactNode;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define columns for responsive grid layout
const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const rowHeight = 50; // Adjust as needed

export function DashboardGrid({
  layouts,
  items,
  onLayoutChange,
  onRemoveItem,
  renderVisualization,
}: DashboardGridProps) {
  return (
    <Card className="flex-grow min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Visualizations added from queries.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={cols}
          rowHeight={rowHeight}
          isDraggable
          isResizable
          onLayoutChange={onLayoutChange}
          margin={[10, 10]}
          compactType="vertical"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border rounded-lg shadow overflow-hidden relative group"
            >
              <DashboardItemCard
                item={item}
                onRemoveItem={onRemoveItem}
                renderVisualization={renderVisualization}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
        {items.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">
            Dashboard is empty. Add visualizations using the query input above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
