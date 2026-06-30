#!/usr/bin/env node
/**
 * MCP server exposing two tools over STDIO:
 *   - web_search: Tavily-backed web search
 *   - read_file:  read a UTF-8 file from the local filesystem
 *
 * Designed to be launched by Claude Desktop via claude_desktop_config.json.
 */
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { webSearch } from "./tools/webSearch.js";
import { readLocalFile } from "./tools/readFile.js";

const server = new McpServer({
  name: "mcp-local-tools",
  version: "1.0.0",
});

// ---- web_search ------------------------------------------------------------
server.registerTool(
  "web_search",
  {
    title: "Web Search",
    description:
      "Search the web via the Tavily API and return ranked results (title, url, snippet).",
    inputSchema: {
      query: z.string().min(1).describe("Search query string"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum number of results to return (default 5)"),
    },
  },
  async ({ query, maxResults }) => {
    try {
      const results = await webSearch(query, maxResults ?? 5);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `web_search failed: ${(err as Error).message}`,
          },
        ],
      };
    }
  }
);

// ---- read_file -------------------------------------------------------------
server.registerTool(
  "read_file",
  {
    title: "Read Local File",
    description:
      "Read a UTF-8 text file from the local filesystem and return its content.",
    inputSchema: {
      filepath: z
        .string()
        .min(1)
        .describe("Absolute or relative path to the file to read"),
    },
  },
  async ({ filepath }) => {
    try {
      const content = await readLocalFile(filepath);
      return { content: [{ type: "text", text: content }] };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `read_file failed: ${(err as Error).message}`,
          },
        ],
      };
    }
  }
);

// ---- bootstrap -------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Logs go to stderr to keep stdout reserved for MCP framing.
  console.error("[mcp-local-tools] ready on stdio");
}

main().catch((err) => {
  console.error("[mcp-local-tools] fatal:", err);
  process.exit(1);
});
