import { createYoga, createSchema } from "graphql-yoga";
import type { NextRequest } from "next/server";

// 1. Define Schema (SDL)
const typeDefs = /* GraphQL */ `
  type Query {
    "A list of sample users"
    users: [User!]!
    "Sample sales data by category"
    salesByCategory: [CategorySales!]!
    "Sample user signups over time"
    signupsOverTime: [TimePoint!]!
    "Sample distribution of user statuses"
    userStatusDistribution: [StatusCount!]!
  }

  type User {
    id: ID!
    name: String!
    email: String
  }

  type CategorySales {
    category: String!
    sales: Int!
  }

  type TimePoint {
    date: String! # Using String for simplicity, could be Date scalar
    count: Int!
  }

  type StatusCount {
    status: String!
    count: Int!
  }
`;

// 2. Define Mock Data
const mockUsers = [
  { id: "1", name: "Alice Wonderland", email: "alice@example.com" },
  { id: "2", name: "Bob The Builder", email: "bob@example.com" },
  { id: "3", name: "Charlie Chaplin", email: null },
];

const mockSales = [
  { category: "Electronics", sales: 1500 },
  { category: "Clothing", sales: 800 },
  { category: "Groceries", sales: 1200 },
  { category: "Books", sales: 350 },
];

const mockSignups = [
  { date: "2023-10-01", count: 5 },
  { date: "2023-10-02", count: 8 },
  { date: "2023-10-03", count: 6 },
  { date: "2023-10-04", count: 10 },
  { date: "2023-10-05", count: 12 },
];

const mockStatuses = [
  { status: "Active", count: 55 },
  { status: "Inactive", count: 20 },
  { status: "Pending", count: 15 },
];

// 3. Define Resolvers
const resolvers = {
  Query: {
    users: () => mockUsers,
    salesByCategory: () => mockSales,
    signupsOverTime: () => mockSignups,
    userStatusDistribution: () => mockStatuses,
  },
  // User resolvers can be added here if needed for specific fields
};

// 4. Create the Yoga instance
const { handleRequest } = createYoga<{
  req: NextRequest;
}>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  // Enable GraphQL multipart request spec for file uploads if needed
  // multipart: true,

  // Set the GraphQL endpoint
  graphqlEndpoint: "/api/mcp-graphql",

  // Enable graphiql playground unless in production
  graphiql: process.env.NODE_ENV !== "production",

  // Use Next.js specific fetch implementation
  fetchAPI: { Response, Request },
});

// 5. Export handlers for GET and POST
export { handleRequest as GET, handleRequest as POST };
