"use client"; // Required for state and handlers later

import React, { useState, useEffect, useCallback } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { nanoid } from "nanoid"; // For unique IDs
import { Layout, Layouts } from "react-grid-layout"; // Keep Layout/Layouts for state/handlers

// Import Chart Wrappers
import { DataTableWrapper } from "@/components/charts/DataTableWrapper";
import { BarChartWrapper } from "@/components/charts/BarChartWrapper";
import { LineChartWrapper } from "@/components/charts/LineChartWrapper";
import { PieChartWrapper } from "@/components/charts/PieChartWrapper";
import { VisualizationSuggestion } from "./api/graphql/route";
import { QueryInput } from "@/components/dashboard/QueryInput";
import { GeneratedQueryDisplay } from "@/components/dashboard/GeneratedQueryDisplay";
import { QueryResultPreview } from "@/components/dashboard/QueryResultPreview";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"; // Import the new component

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

// Type for the state holding query results
interface QueryResultState {
  data: Record<string, unknown> | null;
  errors: GraphQLError[] | null;
}

export default function Home() {
  const [generatedQuery, setGeneratedQuery] = useState(
    "// Generated GraphQL query will appear here"
  );
  const [queryResult, setQueryResult] = useState<QueryResultState | null>(null);
  const [visualizationSuggestion, setVisualizationSuggestion] =
    useState<VisualizationSuggestion | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [hookError, setHookError] = useState<string | null>(null);
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

  const handleSubmit = async (submittedNlQuery: string) => {
    console.log("Submitting NL query:", submittedNlQuery);
    setHookError(null);
    setQueryResult(null);
    setVisualizationSuggestion(null);
    setGeneratedQuery("// Processing Natural Language Query...");
    // Use the submitted query from the component
    runNLQuery({ variables: { nlQuery: submittedNlQuery } });
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

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      {/* Top Section: Input Area */}
      <QueryInput onSubmit={handleSubmit} isLoading={loadingNL} />

      {/* Middle Section: Generated Query & Result Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <GeneratedQueryDisplay query={generatedQuery} />

        {/* Use QueryResultPreview Component */}
        <QueryResultPreview
          queryResult={queryResult}
          visualizationSuggestion={visualizationSuggestion}
          suggestedTitle={suggestedTitle}
          hookError={hookError}
          isLoading={loadingNL}
          onAddToDashboard={handleAddToDashboard}
          renderVisualization={renderVisualization}
        />
      </div>

      {/* Bottom Section: Use DashboardGrid Component */}
      <DashboardGrid
        layouts={layouts}
        items={dashboardItems}
        onLayoutChange={onLayoutChange}
        onRemoveItem={handleRemoveFromDashboard}
        renderVisualization={renderVisualization}
      />
    </div>
  );
}
