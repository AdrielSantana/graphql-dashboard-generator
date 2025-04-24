"use client"; // Required for state and handlers later

import React, { useState, useEffect, useCallback } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nanoid } from "nanoid"; // For unique IDs
import { X } from "lucide-react"; // Import icon for remove button
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout"; // Import RGL

// Import Chart Wrappers
import { DataTableWrapper } from "@/components/charts/DataTableWrapper";
import { BarChartWrapper } from "@/components/charts/BarChartWrapper";
import { LineChartWrapper } from "@/components/charts/LineChartWrapper";
import { PieChartWrapper } from "@/components/charts/PieChartWrapper";
import { VisualizationSuggestion } from "./api/graphql/route";

// Define the GraphQL "query" (using query keyword instead of mutation)
const PROCESS_NL_QUERY = gql`
  query ProcessNaturalLanguageQuery($nlQuery: String!) {
    # Operation name remains, but it's a query type now
    processNLQuery(nlQuery: $nlQuery) {
      data
      errors {
        message
      }
      generatedQuery
      visualization
    }
  }
`;

// Type definition for a single error object
interface GraphQLError {
  message: string;
  [key: string]: unknown;
}

// Update ProcessQueryResponse type to include visualization
type ProcessQueryResponse =
  | {
      data?: Record<string, unknown> | null; // Data can be an object or null
      errors?: GraphQLError[] | null; // Errors is an array of GraphQLError or null
      generatedQuery?: string | null;
      visualization?: VisualizationSuggestion | null; // Add visualization field
    }
  | null
  | undefined;

// Type for items stored in the dashboard state
interface DashboardItem {
  id: string;
  queryResultData: Record<string, unknown> | null; // Matching ProcessQueryResponse['data']
  visualizationSuggestion: VisualizationSuggestion | null;
  suggestedTitle?: string;
  generatedQuery?: string | null;
  // Layout managed separately in `layouts` state for ResponsiveReactGridLayout
}

// Constants for LocalStorage keys
const LOCALSTORAGE_ITEMS_KEY = "dashboardItems";
const LOCALSTORAGE_LAYOUTS_KEY = "dashboardLayouts";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Type for the state holding query results
interface QueryResultState {
  data: Record<string, unknown> | null;
  errors: GraphQLError[] | null;
}

export default function Home() {
  const [nlQuery, setNlQuery] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState(
    "// Generated GraphQL query will appear here"
  );
  // Explicitly type the queryResult state
  const [queryResult, setQueryResult] = useState<QueryResultState | null>(null);
  const [visualizationSuggestion, setVisualizationSuggestion] =
    useState<VisualizationSuggestion | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [hookError, setHookError] = useState<string | null>(null); // State for hook-level errors

  // Initialize state empty, load from localStorage in useEffect
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({});

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Ensure running on client
      try {
        const savedItems = localStorage.getItem(LOCALSTORAGE_ITEMS_KEY);
        if (savedItems) {
          setDashboardItems(JSON.parse(savedItems));
        }
      } catch (error) {
        console.error(
          "Error reading dashboard items from localStorage:",
          error
        );
      }

      try {
        const savedLayouts = localStorage.getItem(LOCALSTORAGE_LAYOUTS_KEY);
        if (savedLayouts) {
          setLayouts(JSON.parse(savedLayouts));
        }
      } catch (error) {
        console.error("Error reading layouts from localStorage:", error);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Use the useLazyQuery hook for queries
  const [runNLQuery, { loading: loadingNL }] = useLazyQuery(PROCESS_NL_QUERY, {
    fetchPolicy: "no-cache", // Don't cache these processing requests
    onCompleted: (data) => {
      console.log(
        "onCompleted (NL) received data arg:",
        JSON.stringify(data, null, 2)
      );
      // Ensure data conforms to ProcessQueryResponse before passing
      const response: ProcessQueryResponse = data?.processNLQuery;
      console.log(
        "onCompleted (NL) extracted response:",
        JSON.stringify(response, null, 2)
      );
      handleQueryComplete(response);
    },
    onError: handleQueryError,
  });

  // --- Save to LocalStorage ---
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCALSTORAGE_ITEMS_KEY,
        JSON.stringify(dashboardItems)
      );
    } catch (error) {
      console.error("Error saving dashboard items to localStorage:", error);
    }
  }, [dashboardItems]);

  useEffect(() => {
    // Only save layouts if they are not empty, prevents overwriting on initial load if empty
    if (Object.keys(layouts).length > 0) {
      try {
        localStorage.setItem(LOCALSTORAGE_LAYOUTS_KEY, JSON.stringify(layouts));
      } catch (error) {
        console.error("Error saving layouts to localStorage:", error);
      }
    }
  }, [layouts]);
  // ---------------------------

  // Renamed function
  function handleQueryComplete(response: ProcessQueryResponse) {
    console.log("Query processing completed. Received response:", response);
    setHookError(null); // Clear hook error on successful completion
    // Add more detailed logging before the check
    console.log("Detailed check inside handleQueryComplete:");
    console.log("- response object:", JSON.stringify(response, null, 2));
    console.log("- typeof response:", typeof response);
    console.log("- response?.errors:", response?.errors);
    console.log("- response?.data:", response?.data);
    console.log("- !!response?.errors:", !!response?.errors);
    console.log("- !!response?.data:", !!response?.data);
    console.log(
      "- response?.visualization?.suggestion?.title:",
      response?.visualization?.suggestion?.title
    );

    if (response?.generatedQuery) {
      setGeneratedQuery(response.generatedQuery);
    } else {
      setGeneratedQuery(
        "// NL Query processed (no query string returned or processing error)"
      );
    }

    // Update queryResult state with proper typing
    if (response?.errors) {
      console.log("handleQueryComplete: Handling errors branch.");
      // Ensure errors is an array or null
      setQueryResult({ errors: response.errors || null, data: null });
      setGeneratedQuery("// Error processing query (see results)");
    } else if (response?.data) {
      console.log("handleQueryComplete: Handling data branch.");
      // Ensure data is Record or null
      setQueryResult({ data: response.data || null, errors: null });
      if (response?.generatedQuery) {
        setGeneratedQuery(response.generatedQuery);
      } else {
        setGeneratedQuery("// Query executed successfully (original NL query)");
      }
    } else {
      console.log("handleQueryComplete: Handling UNEXPECTED structure branch.");
      setQueryResult({
        errors: [{ message: "Unexpected response structure" }],
        data: null,
      });
      setGeneratedQuery("// Received unexpected response from backend");
    }

    // Update visualization suggestion AND title states
    if (response?.visualization) {
      setVisualizationSuggestion(response.visualization);
      // Set the title from the suggestion if available
      setSuggestedTitle(response.visualization.suggestion?.title || null);
    } else {
      setVisualizationSuggestion(null);
      setSuggestedTitle(null);
    }
    console.log("Updated queryResult state:", queryResult);
    console.log(
      "Updated visualizationSuggestion state:",
      visualizationSuggestion
    );
    console.log("Updated suggestedTitle state:", suggestedTitle);
  }

  function handleQueryError(err: Error) {
    console.error("Query processing error (hook onError):", err);
    setGeneratedQuery(`// Error: ${err.message}`);
    setQueryResult(null); // Clear results
    setVisualizationSuggestion(null);
    setSuggestedTitle(null);
    setHookError(`Query Execution Error: ${err.message}`); // Set the hook error state
  }

  const handleSubmit = async () => {
    console.log("Submitting NL query:", nlQuery);
    setHookError(null); // Clear previous errors
    setQueryResult(null); // Clear previous results
    setVisualizationSuggestion(null); // Clear previous suggestion
    setGeneratedQuery("// Processing Natural Language Query..."); // Indicate processing
    runNLQuery({ variables: { nlQuery } });
  };

  const handleAddToDashboard = () => {
    // Check if queryResult exists and has either data or errors
    if (!queryResult || (!queryResult.data && !queryResult.errors)) {
      console.warn("Cannot add to dashboard: Query result is null or empty.");
      return;
    }

    const newItemId = nanoid();
    const newItem: DashboardItem = {
      id: newItemId,
      // Use data from state, which is correctly typed Record | null
      queryResultData: queryResult.data,
      visualizationSuggestion: visualizationSuggestion,
      suggestedTitle: suggestedTitle || "Untitled Visualization",
      // Store generated query only if there were no errors in the result state
      generatedQuery: queryResult.errors ? null : generatedQuery,
    };

    // Update Dashboard Items State
    setDashboardItems((prevItems) => [...prevItems, newItem]);

    // Define Default Layout for New Item
    const defaultWidth = 6;
    const defaultHeight = 6;
    const newLayout: Layout = {
      i: newItemId,
      x: (dashboardItems.length * defaultWidth) % 12,
      y: Infinity,
      w: defaultWidth,
      h: defaultHeight,
    };

    // Update Layouts State
    setLayouts((prevLayouts) => {
      const newLayouts = { ...prevLayouts };
      for (const breakpoint in newLayouts) {
        if (Object.prototype.hasOwnProperty.call(newLayouts, breakpoint)) {
          // Ensure the array exists before spreading
          const currentBreakpointLayout = newLayouts[breakpoint] || [];
          newLayouts[breakpoint] = [...currentBreakpointLayout, newLayout]
            .filter((item) => item.i !== undefined)
            .map((l) => ({ ...l }));
        }
      }
      if (!newLayouts["lg"]) {
        newLayouts["lg"] = [newLayout];
      }
      return newLayouts;
    });

    console.log("Added item to dashboard:", newItem);
    console.log("Updated layouts state shortly after adding:", layouts); // Check state timing
  };

  const handleRemoveFromDashboard = (idToRemove: string) => {
    setDashboardItems((prevItems) =>
      prevItems.filter((item) => item.id !== idToRemove)
    );
    setLayouts((prevLayouts) => {
      const newLayouts = { ...prevLayouts };
      for (const breakpoint in newLayouts) {
        if (Object.prototype.hasOwnProperty.call(newLayouts, breakpoint)) {
          // Ensure the array exists before filtering
          const currentBreakpointLayout = newLayouts[breakpoint] || [];
          newLayouts[breakpoint] = currentBreakpointLayout.filter(
            (l) => l.i !== idToRemove
          );
        }
      }
      return newLayouts;
    });
  };

  // Updated renderVisualization function
  const renderVisualization = (
    data: Record<string, unknown> | null,
    suggestion: VisualizationSuggestion | null
  ) => {
    const suggestionDetails = suggestion?.suggestion;

    // Find the array within the data object
    // Assumes the actual data array is the first value found that is an array
    const findArrayInObject = (
      obj: Record<string, unknown> | null
    ): Record<string, unknown>[] | null => {
      if (!obj) return null;
      if (Array.isArray(obj)) return obj as Record<string, unknown>[];
      for (const key in obj) {
        // Explicitly type the value being checked
        const value: unknown = obj[key];
        if (Array.isArray(value)) {
          // Check if the array is not empty and its first element is an object
          if (
            value.length === 0 ||
            (value.length > 0 &&
              typeof value[0] === "object" &&
              value[0] !== null)
          ) {
            // Type assertion is safe here due to checks
            return value as Record<string, unknown>[];
          }
        }
      }
      return null;
    };

    const chartDataArray = findArrayInObject(data);

    if (!suggestionDetails || !chartDataArray || chartDataArray.length === 0) {
      // Render raw data if no suggestion or no valid array data found
      return (
        <pre className="text-xs overflow-auto">
          {data
            ? JSON.stringify(data, null, 2)
            : "No data or visualization suggestion."}
        </pre>
      );
    }

    // Now suggestionDetails and chartDataArray are guaranteed to exist and be valid
    const { type } = suggestionDetails;

    switch (
      type.toLowerCase() // Ensure case-insensitivity
    ) {
      case "table":
        return <DataTableWrapper data={chartDataArray} />;
      case "barchart":
        return <BarChartWrapper data={chartDataArray} />;
      case "linechart":
        return <LineChartWrapper data={chartDataArray} />;
      case "piechart":
        return <PieChartWrapper data={chartDataArray} />;
      default:
        return (
          <pre className="text-xs overflow-auto">
            {`Unknown/unsupported visualization type: ${type}\n${JSON.stringify(
              data, // Show original data object on error
              null,
              2
            )}`}
          </pre>
        );
    }
  };

  // Use useCallback for onLayoutChange to prevent unnecessary recreation
  const onLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
      if (
        Object.keys(allLayouts).length > 0 &&
        JSON.stringify(allLayouts) !== JSON.stringify(layouts)
      ) {
        console.log("Layout changed, updating state:", allLayouts);
        setLayouts(allLayouts);
      }
    },
    [layouts]
  ); // Dependency array includes layouts

  // Define columns for responsive grid layout
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      {/* Top Section: Input Area */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle>Query Input</CardTitle>
          <CardDescription>
            Enter your query in natural language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., 'Show me the total sales per product category'"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={loadingNL || !nlQuery.trim()}
            >
              {loadingNL ? "Processing..." : "Generate & Execute Query"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Middle Section: Generated Query & Result Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle>Generated GraphQL Query</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={generatedQuery}
              rows={8}
              className="font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Query Result Preview</CardTitle>
            {queryResult && (queryResult.data || queryResult.errors) && (
              <Button
                size="sm"
                onClick={handleAddToDashboard}
                disabled={
                  !!queryResult.errors || !queryResult.data || loadingNL
                }
              >
                Add to Dashboard
              </Button>
            )}
          </CardHeader>
          <CardHeader>
            <CardTitle className="text-sm font-medium truncate">
              {visualizationSuggestion?.suggestion?.title || "Visualization"}
            </CardTitle>
            <CardDescription>
              {visualizationSuggestion?.suggestion?.reasoning}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-60 overflow-auto">
            {loadingNL && <p>Loading results...</p>}
            {hookError && <p className="text-red-500">Error: {hookError}</p>}
            {queryResult?.errors && queryResult.errors.length > 0 && (
              <div className="text-red-500">
                <h4 className="font-semibold">Errors:</h4>
                <ul>
                  {queryResult.errors.map(
                    (err: GraphQLError, index: number) => (
                      <li key={index}>- {err.message}</li>
                    )
                  )}
                </ul>
              </div>
            )}
            {queryResult?.data &&
              !queryResult.errors &&
              (visualizationSuggestion?.suggestion ? (
                renderVisualization(queryResult.data, visualizationSuggestion)
              ) : (
                <pre className="text-xs">
                  {JSON.stringify(queryResult.data, null, 2)}
                </pre>
              ))}
            {!loadingNL && !hookError && !queryResult && (
              <p className="text-muted-foreground">Result will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Dashboard Area */}
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
            rowHeight={50}
            isDraggable
            isResizable
            onLayoutChange={onLayoutChange}
            margin={[10, 10]}
            compactType="vertical"
          >
            {dashboardItems.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-lg shadow overflow-hidden relative group"
              >
                <Card className="w-full h-full flex flex-col">
                  <CardHeader className="flex-shrink-0 pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium truncate">
                      {item.suggestedTitle || "Visualization"}
                    </CardTitle>
                    <CardDescription>
                      {item.visualizationSuggestion?.suggestion?.reasoning}
                    </CardDescription>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveFromDashboard(item.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-grow p-2 overflow-auto">
                    {renderVisualization(
                      item.queryResultData,
                      item.visualizationSuggestion
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </ResponsiveGridLayout>
          {dashboardItems.length === 0 && (
            <p className="text-center text-muted-foreground mt-4">
              Dashboard is empty. Add visualizations using the query input
              above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
