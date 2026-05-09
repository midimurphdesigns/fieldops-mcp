#!/usr/bin/env bun
/**
 * Smoke test: spawns the MCP server as a child process over stdio,
 * connects an MCP client, and exercises a multi-tool workflow.
 *
 * Mode A — deterministic (default): scripted client, no LLM, CI-safe.
 * Mode B — live Claude: when ANTHROPIC_API_KEY is set, an Anthropic
 *   message loop drives the same tools, producing a real transcript.
 *
 * Both modes print a transcript to stdout in identical shape, so the
 * README example is verifiable against either run.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";

type ToolCall = { name: string; input: Record<string, unknown> };

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", "src/server.ts"],
  });
  const client = new Client({ name: "fieldops-smoke", version: "0.1.0" });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

function divider(label: string): void {
  console.log(`\n=== ${label} ===\n`);
}

async function callAndPrint(client: Client, call: ToolCall): Promise<unknown> {
  console.log(`> ${call.name}(${JSON.stringify(call.input)})`);
  const result = await client.callTool({ name: call.name, arguments: call.input });
  const content = result.content as Array<{ type: string; text?: string }>;
  const text = content?.[0]?.text ?? "(no text content)";
  console.log(text);
  return text;
}

async function deterministic(): Promise<void> {
  divider("Deterministic smoke (no LLM)");
  await withClient(async (client) => {
    const list = await client.listTools();
    console.log(`Server advertises ${list.tools.length} tools:`);
    for (const t of list.tools) console.log(`  - ${t.name}`);

    const script: ToolCall[] = [
      { name: "list_open_jobs", input: { priority: "urgent" } },
      {
        name: "find_available_techs",
        input: {
          skill: "hvac",
          window_start: "2026-05-12T13:00:00Z",
          window_end: "2026-05-12T16:00:00Z",
        },
      },
      {
        name: "assign_job",
        input: {
          job_id: "J-2001",
          tech_id: "T-01",
          scheduled_at: "2026-05-12T13:00:00Z",
        },
      },
      {
        name: "draft_customer_message",
        input: { job_id: "J-2001", intent: "confirmation" },
      },
      { name: "compute_utilization", input: { window_days: 7 } },
      {
        name: "flag_for_human",
        input: {
          job_id: "J-2011",
          reason: "Customer mentioned a part number we don't recognize; needs human triage",
        },
      },
    ];

    for (const call of script) {
      await callAndPrint(client, call);
    }
  });
}

async function live(apiKey: string): Promise<void> {
  divider("Live Claude smoke");
  await withClient(async (client) => {
    const list = await client.listTools();
    const anthropic = new Anthropic({ apiKey });

    const tools = list.tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
    }));

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content:
          "You are a dispatch assistant for a small field-services company. " +
          "Three urgent HVAC requests came in this morning. Triage the queue, " +
          "find an available HVAC tech for J-2001 in the 13:00–16:00 UTC window today, " +
          "assign them, draft a confirmation message to the customer, then run a utilization " +
          "check for the next 7 days. If anything looks ambiguous, flag for a human.",
      },
    ];

    let turn = 0;
    while (turn++ < 8) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        tools,
        messages,
      });

      const assistantContent = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      const toolUses = assistantContent.filter((b) => b.type === "tool_use");
      const textBlocks = assistantContent.filter((b) => b.type === "text");
      for (const t of textBlocks) {
        if (t.type === "text") console.log(`assistant: ${t.text}`);
      }

      if (toolUses.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUses) {
        if (block.type !== "tool_use") continue;
        console.log(`> ${block.name}(${JSON.stringify(block.input)})`);
        const result = await client.callTool({
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
        const content = result.content as Array<{ type: string; text?: string }>;
        const text = content?.[0]?.text ?? "";
        console.log(text);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: text,
          is_error: result.isError === true,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }
  });
}

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  await deterministic();
  if (apiKey) {
    await live(apiKey);
  } else {
    divider("Live Claude smoke skipped (set ANTHROPIC_API_KEY to run)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
