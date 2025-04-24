"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Pencil, RefreshCw, Info } from "lucide-react";
import type { VisualizationSuggestion } from "@/app/api/graphql/route";

// Define DashboardItem type locally
interface DashboardItem {
  id: string;
  queryResultData: Record<string, unknown> | null;
  visualizationSuggestion: VisualizationSuggestion | null;
  suggestedTitle?: string;
  generatedQuery?: string | null;
}

interface DashboardItemCardProps {
  item: DashboardItem;
  onRemoveItem: (id: string) => void;
  renderVisualization: (
    data: Record<string, unknown> | null,
    suggestion: VisualizationSuggestion | null
  ) => React.ReactNode;
}

export function DashboardItemCard({
  item,
  onRemoveItem,
  renderVisualization,
}: DashboardItemCardProps) {
  const handleEdit = () => {
    console.log("Edit action triggered for item:", item.id);
    // TODO: Implement edit functionality (e.g., open modal)
  };

  const handleRerun = () => {
    console.log("Re-run action triggered for item:", item.id);
    // TODO: Implement re-run functionality
  };

  // Function to stop event propagation
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-2 pt-4 px-4 flex flex-row justify-between items-start">
        <div className="flex-grow overflow-hidden mr-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-sm font-medium truncate cursor-default">
                  {item.suggestedTitle || "Visualization"}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.suggestedTitle || "Visualization"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CardDescription className="text-xs text-muted-foreground">
            {item.visualizationSuggestion?.suggestion?.reasoning || "-"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {item.generatedQuery && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onMouseDown={stopPropagation}
                >
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Show Query</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Generated Query</h4>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded-md overflow-auto max-h-40 font-mono">
                    {item.generatedQuery}
                  </pre>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleEdit}
                  onMouseDown={stopPropagation}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Title/Description</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRerun}
                  onMouseDown={stopPropagation}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Re-run Query</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Re-run Query</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onRemoveItem(item.id)}
                  onMouseDown={stopPropagation}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove Item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-2 overflow-auto">
        {renderVisualization(
          item.queryResultData,
          item.visualizationSuggestion
        )}
      </CardContent>
    </Card>
  );
}
