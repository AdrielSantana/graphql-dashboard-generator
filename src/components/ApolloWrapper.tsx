"use client";

import React from "react";
import { ApolloProvider } from "@apollo/client";
import createApolloClient from "@/lib/apolloClient";

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = createApolloClient();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
