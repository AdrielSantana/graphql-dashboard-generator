"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QueryInputProps {
  onSubmit: (nlQuery: string) => void;
  isLoading: boolean;
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [nlQuery, setNlQuery] = useState("");

  const handleSubmit = () => {
    if (nlQuery.trim()) {
      onSubmit(nlQuery);
    }
  };

  return (
    <Card className="flex-shrink-0">
      <CardHeader>
        <CardTitle>Query Input</CardTitle>
        <CardDescription>Enter your query in natural language.</CardDescription>
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
            disabled={isLoading || !nlQuery.trim()}
          >
            {isLoading ? "Processing..." : "Generate & Execute Query"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
