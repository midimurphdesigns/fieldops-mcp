#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { z } from "zod";
import { tools } from "./tools/index.ts";
import { store } from "./store.ts";
import { toToolError } from "./errors.ts";

const server = new McpServer({
  name: "fieldops-mcp",
  version: "0.1.0",
});

type Registrable = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (input: unknown, ctx: { store: typeof store }) => unknown;
};

for (const tool of Object.values(tools) as readonly Registrable[]) {
  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema: tool.inputSchema.shape },
    (args: Record<string, unknown>) => {
      try {
        const result = tool.handler(args, { store });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        const e = toToolError(err);
        return {
          isError: true,
          content: [{ type: "text" as const, text: JSON.stringify(e, null, 2) }],
        };
      }
    },
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
