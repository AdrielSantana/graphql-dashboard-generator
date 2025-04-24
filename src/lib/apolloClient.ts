import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const createApolloClient = () => {
  return new ApolloClient({
    // Use HttpLink to connect to the internal GraphQL endpoint exposed by Next.js
    link: new HttpLink({
      // TEMPORARILY pointing to the mock data endpoint for testing
      // uri: "/api/mcp-graphql",
      uri: "/api/graphql", // Original endpoint for LLM processing
      // You can add headers here if needed for authentication, etc.
      // headers: {
      //   authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
      // },
    }),
    cache: new InMemoryCache(),
    // Optional: Default options for queries/mutations
    // defaultOptions: {
    //   watchQuery: {
    //     fetchPolicy: 'cache-and-network',
    //   },
    // },
  });
};

export default createApolloClient;
