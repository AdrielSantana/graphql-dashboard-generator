import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// Remove unused graphql imports
// import { getIntrospectionQuery, buildClientSchema, printSchema } from "graphql";
import fs from "fs/promises";
import path from "path";
import { request, gql } from "graphql-request"; // Import graphql-request
import { parse } from "graphql"; // Import the parse function

// Initialize OpenAI Client
// Ensure OPENAI_API_KEY is set in your .env.local file
// No longer unused: // eslint-disable-next-line @typescript-eslint/no-unused-vars
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define a basic placeholder type for a GraphQL result
type GraphQLResult = {
  data?: Record<string, unknown> | null;
  // Removed readonly for broader compatibility
  errors?: { message: string; [key: string]: unknown }[] | null;
};

// Define endpoint for actual execution, reading from environment variable
const MCP_ENDPOINT =
  process.env.MCP_ENDPOINT || "http://localhost:3000/api/mcp-graphql";

// Placeholder for the actual internal MCP GraphQL handler function
// This now executes the query against the MCP_ENDPOINT
async function executeInternalMCPQuery(
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResult> {
  console.log(`Executing real query against ${MCP_ENDPOINT}:`, {
    query,
    variables,
  });

  const endpoint = MCP_ENDPOINT;

  try {
    // TODO: Add authentication headers (e.g., API Key, Bearer Token)
    // Load secrets securely from environment variables
    const headers = {
      "Content-Type": "application/json",
      // 'Authorization': `Bearer ${process.env.MCP_API_TOKEN}`,
      // 'X-API-Key': process.env.MCP_API_KEY,
    };

    // Use graphql-request to send the query
    // We need to parse the query string using gql tag for graphql-request
    // Note: Parsing happens here, not necessarily validation against a schema
    const gqlQuery = gql`
      ${query}
    `; // Parse the query string

    // The result directly from graphql-request might not have the top-level 'data' key
    const rawResult: Record<string, unknown> = await request(
      endpoint,
      gqlQuery, // Pass the parsed query
      variables,
      headers
    );

    console.log("Received raw result from MCP endpoint:", rawResult);

    // Define expected structure for errors within the raw response
    type RawError = { message?: string; [key: string]: unknown };

    // Check if the raw result itself contains GraphQL errors
    if (
      rawResult &&
      typeof rawResult === "object" &&
      "errors" in rawResult &&
      Array.isArray(rawResult.errors)
    ) {
      const errorsArray = rawResult.errors;
      // Check if items in array look like errors
      if (
        errorsArray.length > 0 &&
        typeof errorsArray[0] === "object" &&
        errorsArray[0] !== null
      ) {
        console.warn(
          "MCP endpoint returned errors within the response object.",
          errorsArray
        );
        return {
          data: null,
          // Map using the RawError type
          errors: (errorsArray as RawError[]).map((e: RawError) => ({
            message: e?.message || "Unknown error from MCP response",
          })),
        };
      }
    }

    // If no errors found in the object or errors array is invalid, assume success
    return { data: rawResult, errors: null };
  } catch (error: unknown) {
    console.error(`Error executing query against ${endpoint}:`, error);

    // --- Refined Error Message Extraction ---
    let extractedMessages: string[] = [];
    // Define a simple type for the expected GraphQL error structure
    type GqlError = { message?: string; [key: string]: unknown };

    if (
      error instanceof Error &&
      "response" in error &&
      typeof error.response === "object" &&
      error.response !== null &&
      "errors" in error.response &&
      Array.isArray(error.response.errors)
    ) {
      // Extract messages from GraphQL errors array
      extractedMessages = error.response.errors.map(
        // Use the defined type here
        (gqlError: GqlError) => gqlError?.message || "Unknown GraphQL error"
      );
    }

    // Fallback to general error message if no specific GraphQL errors found
    if (extractedMessages.length === 0 && error instanceof Error) {
      extractedMessages.push(error.message);
    }

    // If still no message, use a generic one
    if (extractedMessages.length === 0) {
      extractedMessages.push(
        "Failed to execute query against internal endpoint or unknown error format."
      );
    }
    // -----------------------------------------

    return {
      // Return the cleaned-up messages
      data: null,
      errors: extractedMessages.map((message) => ({ message })),
    };
  }
}

// --- Function to get Schema Context from Generated File ---
const SCHEMA_FILE_PATH = path.resolve("src/generated/schema.graphql"); // Use path.resolve
let schemaInMemoryCache: string | null = null; // Keep in-memory cache for performance

async function getSchemaContextFromFile(): Promise<string | null> {
  // 1. Check in-memory cache
  if (schemaInMemoryCache) {
    console.log("Using in-memory schema context.");
    return schemaInMemoryCache;
  }

  // 2. Read from generated file
  console.log(`Attempting to read schema from ${SCHEMA_FILE_PATH}...`);
  try {
    const fileSDL = await fs.readFile(SCHEMA_FILE_PATH, "utf-8");
    console.log("Successfully read schema from generated file.");
    schemaInMemoryCache = fileSDL; // Populate in-memory cache
    return fileSDL;
  } catch (error: unknown) {
    console.error(`Failed to read schema file ${SCHEMA_FILE_PATH}:`, error);
    // Log a more specific error if it's a file-not-found error
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(
        "Schema file not found. Please ensure you have run 'graphql-codegen'."
      );
    }
    return null; // Indicate schema context could not be loaded
  }
}
// -----------------------------------------------------

// Function to translate Natural Language to GraphQL using LLM
async function translateNLtoGraphQL(
  naturalLanguageQuery: string,
  schemaContext: string | null
): Promise<string> {
  console.log("Calling LLM to translate:", naturalLanguageQuery);
  console.log(
    "Using schema context:",
    schemaContext ? schemaContext.substring(0, 100) + "..." : "None"
  );

  // Refined Prompt:
  const prompt = `
    Dado o seguinte contexto do schema GraphQL:
    ---SCHEMA START---
    ${schemaContext || "Contexto do schema não disponível."}
    ---SCHEMA END---

    Traduza a seguinte consulta em linguagem natural para uma consulta GraphQL válida baseada *apenas* no schema fornecido.
    
    Exemplo:
    Linguagem Natural: "mostre todos os usuários"
    Consulta GraphQL: 
    \`\`\`graphql
    query GetAllUsers {\n  users {\n    id\n    name\n    email\n  }\n}\`\`\`
    (Fim do Exemplo)

    Agora, traduza esta consulta:
    Linguagem Natural: "${naturalLanguageQuery}"
    Consulta GraphQL:
  `;
  // Instructions like "Return only the GraphQL query." are often added as system messages or handled by parsing.

  // --- Actual OpenAI API call ---
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a recommended newer model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Keep temperature low for consistency
      // max_tokens: 1000, // Optional: limit response length
    });

    // Log the raw response for debugging
    // console.log("OpenAI Completion Response:", JSON.stringify(completion, null, 2));

    const generatedText = completion.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      throw new Error("LLM did not return any content.");
    }

    // Attempt to remove potential markdown backticks
    const cleanedText = generatedText
      .replace(/^```graphql\n?/, "")
      .replace(/\n?```$/, "");

    // === Use parse for Validation ===
    try {
      parse(cleanedText); // Attempt to parse the cleaned text
      console.log("LLM generated text parsed successfully as GraphQL.");
      // If parsing succeeds, it's likely a valid query structure
      return cleanedText;
    } catch (parseError: unknown) {
      // If parsing fails, the LLM likely returned explanatory text or invalid GraphQL
      console.error(
        "LLM returned text that failed GraphQL parsing:",
        cleanedText
      );
      console.error(
        "Parse error:",
        parseError instanceof Error ? parseError.message : parseError
      );
      throw new Error(
        `LLM response could not be parsed as a valid GraphQL query. Response: "${cleanedText.substring(
          0,
          100
        )}${cleanedText.length > 100 ? "..." : ""}"`
      );
    }
    // ==============================
  } catch (error) {
    // Log the original error if it wasn't the parsing error we just threw
    if (
      !(
        error instanceof Error &&
        error.message.startsWith("LLM response could not be parsed")
      )
    ) {
      console.error("Error during LLM translation or parsing:", error);
    }
    // Re-throw a consistent error format
    throw new Error(
      `Failed to translate query: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// --- Type for Visualization Suggestion ---
export type FieldMapping = {
  category?: string; // x-axis / pie slice category
  value?: string; // y-axis / pie slice value
  time?: string; // time axis for line charts
  [key: string]: string | undefined; // Allow other potential mappings
};

export type VisualizationSuggestion = {
  suggestion: {
    type: string; // e.g., "barchart", "linechart", "piechart", "table"
    reasoning: string;
    title?: string; // Add optional title field
    fieldMapping: FieldMapping;
  } | null;
  error?: string | null; // Include potential error message
};
// -----------------------------------------

// --- Function to Suggest Visualization ---
// Use the defined return type
async function suggestVisualization(
  query: string,
  data: Record<string, unknown>,
  nlQuery: string
): Promise<VisualizationSuggestion> {
  console.log("Calling LLM to suggest visualization...");

  // Limit the data sent to the LLM to avoid exceeding context limits
  // Simple approach: stringify and truncate. Better: select key fields/rows.
  const dataSample = JSON.stringify(data, null, 2).substring(0, 2000); // Truncate sample

  // Refined Prompt:
  const prompt = `
    Você é um assistente especialista em visualização de dados.
    Dada a seguinte consulta em linguagem natural:
    \`\`\`natural
    ${nlQuery}
    \`\`\`

    A seguinte consulta GraphQL:
    \`\`\`graphql
    ${query}
    \`\`\`

    E uma amostra dos dados retornados (primeiros registros/resumo):
    \`\`\`json
    ${dataSample}
    \`\`\`

    Analise a consulta e a estrutura dos dados.
    1. Sugira um título conciso e descritivo para um gráfico representando estes dados (ex: "Vendas por Categoria", "Tendência de Cadastros de Usuários").
    2. Caso não especificado pelo usuário, sugira o tipo de visualização mais apropriado desta lista: ["barchart", "linechart", "piechart", "table"]. Use "table" como padrão se nenhum gráfico for adequado.
    3. Sugira os campos de dados (chaves da amostra JSON) para mapeamento: 
       - "category": Categoria principal/rótulo/eixo-x.
       - "value": Valor numérico principal/contagem/eixo-y.
       - "time": Eixo baseado em tempo (para LineChart).
    4. Forneça uma breve explicação para a escolha do tipo de gráfico.
    
    Retorne a sugestão APENAS como um objeto JSON válido seguindo esta estrutura exata:
    { 
      "suggestion": { 
        "title": "<título_descritivo_conciso>", 
        "type": "<tipo_gráfico>", 
        "reasoning": "<explicação_breve>",
        "fieldMapping": { 
          "category": "<nome_campo_para_categoria_ou_eixo_x>", 
          "value": "<nome_campo_para_valor_ou_eixo_y>",
          "time": "<nome_campo_para_series_temporais_ou_null>"
        }
      }
    }
  `;

  console.log("--- Visualization Suggestion Prompt (Truncated) ---");
  console.log(prompt.substring(0, 500) + "...");
  console.log("--- End Visualization Suggestion Prompt ---");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or another capable model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Slightly higher temp for more creative suggestions?
      response_format: { type: "json_object" }, // Request JSON output
    });

    const suggestionJson = completion.choices[0]?.message?.content?.trim();
    if (!suggestionJson) {
      throw new Error("LLM did not return a suggestion JSON.");
    }

    console.log("LLM suggestion JSON string:", suggestionJson);
    const suggestion = JSON.parse(suggestionJson);
    console.log("Parsed LLM suggestion:", suggestion);

    // Validate structure - ensure title is present now too
    if (
      !suggestion?.suggestion?.title || // Check for title
      !suggestion?.suggestion?.type ||
      !suggestion?.suggestion?.reasoning ||
      !suggestion?.suggestion?.fieldMapping
    ) {
      throw new Error(
        "LLM suggestion JSON is missing required fields (suggestion.{title, type, reasoning, fieldMapping})."
      );
    }
    return suggestion as VisualizationSuggestion;
  } catch (error) {
    console.error("Error calling OpenAI for visualization suggestion:", error);
    return {
      suggestion: null,
      error: `Failed to get visualization suggestion: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
// -----------------------------------------

// --- Main POST Handler ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, operationName, variables } = body;

    console.log("Received request:", { query, operationName, variables });

    // Determine action based on operationName
    if (operationName === "ProcessNaturalLanguageQuery") {
      const nlQuery = variables?.nlQuery as string;
      if (!nlQuery) {
        return NextResponse.json(
          {
            errors: [
              { message: "Natural language query (nlQuery) is required." },
            ],
          },
          { status: 400 }
        );
      }

      console.log("Processing Natural Language Query:", nlQuery);

      try {
        // 1. Get Schema Context
        const schemaContext = await getSchemaContextFromFile();

        // 2. Translate NL to GraphQL
        const generatedQuery = await translateNLtoGraphQL(
          nlQuery,
          schemaContext
        );
        console.log("Generated GraphQL Query:", generatedQuery);

        // 3. Execute Generated Query
        const executionResult = await executeInternalMCPQuery(generatedQuery);
        console.log("Execution Result:", executionResult);

        // 4. Suggest Visualization (only if execution was successful)
        let visualization: VisualizationSuggestion = {
          suggestion: null,
          error: null,
        };
        if (executionResult.data && !executionResult.errors) {
          // Pass the generated query and the data part of the result
          visualization = await suggestVisualization(
            generatedQuery,
            executionResult.data,
            nlQuery
          );
        }

        // 5. Format and Return Response
        const responsePayload = {
          data: {
            processNLQuery: {
              data: executionResult.data, // Include data
              errors: executionResult.errors, // Include errors
              generatedQuery: generatedQuery,
              visualization: visualization,
            },
          },
        };
        console.log("Returning NL response payload:", responsePayload);
        return NextResponse.json(responsePayload);
      } catch (error: unknown) {
        // Handle errors during NL processing steps
        console.error("Error during NL processing pipeline:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred during NL processing.";
        // Return error in the expected GraphQL structure for processNLQuery
        return NextResponse.json({
          data: {
            processNLQuery: {
              data: null,
              errors: [{ message: errorMessage }],
              generatedQuery: null,
              visualization: { suggestion: null, error: errorMessage },
            },
          },
        });
      }
    } else if (operationName === "ProcessDirectQuery") {
      // REMOVED: Logic for handling direct query
      console.log("Received request for removed operation: ProcessDirectQuery");
      return NextResponse.json(
        {
          errors: [{ message: "Direct query functionality has been removed." }],
        },
        { status: 400 }
      );
    } else {
      // Handle unknown operation
      console.log("Unknown operation name:", operationName);
      return NextResponse.json(
        {
          errors: [
            {
              message: `Unknown operation name: ${operationName}. Supported operations: ProcessNaturalLanguageQuery.`,
            },
          ],
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error parsing request body or unexpected error:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Failed to process request.",
            detail: error instanceof Error ? error.message : String(error),
          },
        ],
      },
      { status: 500 }
    );
  }
}

// You might also need a GET handler if you plan to use it for schema fetching or other purposes.
// export async function GET(request: NextRequest) {
//   // ... implementation ...
// }
