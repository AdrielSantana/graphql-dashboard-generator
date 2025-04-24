"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Import only exported types from the API route
import type { VisualizationSuggestion } from "@/app/api/graphql/route";

// Define GraphQLError locally for this component
interface GraphQLError {
  message: string;
  [key: string]: unknown;
}

// Type matching the state structure in page.tsx
interface QueryResultState {
  data: Record<string, unknown> | null;
  errors: GraphQLError[] | null;
}

interface QueryResultPreviewProps {
  queryResult: QueryResultState | null;
  visualizationSuggestion: VisualizationSuggestion | null;
  suggestedTitle: string | null; // This comes from the visualization suggestion
  hookError: string | null;
  isLoading: boolean;
  onAddToDashboard: () => void;
  renderVisualization: (
    data: Record<string, unknown> | null,
    suggestion: VisualizationSuggestion | null
  ) => React.ReactNode;
}

export function QueryResultPreview({
  queryResult,
  visualizationSuggestion,
  suggestedTitle,
  hookError,
  isLoading,
  onAddToDashboard,
  renderVisualization,
}: QueryResultPreviewProps) {
  const canAddToDashboard =
    queryResult && (queryResult.data || queryResult.errors) && !isLoading;
  const disableAddButton =
    !!queryResult?.errors || !queryResult?.data || isLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Query Result Preview</CardTitle>
        {canAddToDashboard && (
          <Button
            size="sm"
            onClick={onAddToDashboard}
            disabled={disableAddButton}
          >
            Add to Dashboard
          </Button>
        )}
      </CardHeader>
      <CardHeader>
        {/* Use title from suggestion, fallback gracefully */}
        <CardTitle className="text-sm font-medium truncate">
          {suggestedTitle || "Visualization Preview"}
        </CardTitle>
        <CardDescription>
          {visualizationSuggestion?.suggestion?.reasoning ||
            (queryResult?.data ? "Raw data preview" : "")}
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-60 overflow-auto">
        {isLoading && <p>Loading results...</p>}
        {hookError && <p className="text-red-500">Error: {hookError}</p>}
        {/* Display backend errors from queryResult */}
        {queryResult?.errors && queryResult.errors.length > 0 && (
          <div className="text-red-500">
            <h4 className="font-semibold">Errors:</h4>
            <ul>
              {/* Explicitly type err here for clarity */}
              {queryResult.errors.map((err: GraphQLError, index: number) => (
                <li key={index}>- {err.message}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Display data/visualization if no errors */}
        {queryResult?.data &&
          !queryResult.errors &&
          // Pass data and suggestion to the render function provided by parent
          renderVisualization(queryResult.data, visualizationSuggestion)}
        {/* Fallback message when idle */}
        {!isLoading && !hookError && !queryResult && (
          <p className="text-muted-foreground">Result will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}
