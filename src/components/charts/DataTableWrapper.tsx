"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableWrapperProps {
  data: Record<string, unknown>[] | null; // Use more specific type
  // fieldMapping?: FieldMapping; // Might use later for column selection/ordering
}

export function DataTableWrapper({ data }: DataTableWrapperProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No data available for table.
      </p>
    );
  }

  // Ensure data[0] exists before getting keys
  if (!data[0]) {
    return (
      <p className="text-muted-foreground text-sm">
        Data format error (empty objects?).
      </p>
    );
  }
  const headers = Object.keys(data[0]);

  return (
    <div className="min-w-[300px] max-h-[400px] overflow-auto border rounded-md">
      <Table>
        {/* <TableCaption>A list of your data.</TableCaption> */}
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {headers.map((header) => (
                <TableCell key={`${rowIndex}-${header}`}>
                  {/* Handle potential non-string values */}
                  {typeof row[header] === "object"
                    ? JSON.stringify(row[header])
                    : String(row[header] ?? "N/A")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
