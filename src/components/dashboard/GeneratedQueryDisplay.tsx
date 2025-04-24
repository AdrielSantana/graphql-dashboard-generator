"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneratedQueryDisplayProps {
  query: string;
}

export function GeneratedQueryDisplay({ query }: GeneratedQueryDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated GraphQL Query</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={query}
          rows={8}
          className="font-mono text-sm resize-none"
        />
      </CardContent>
    </Card>
  );
}
