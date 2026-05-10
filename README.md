# fieldops-mcp

> An MCP server that exposes a small-business field-services workflow — triage, scheduling, customer comms, utilization analysis, human escalation — as agent tools an LLM client can drive end-to-end.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Showcase:** [fieldops-mcp.kevinmurphywebdev.com](https://fieldops-mcp.kevinmurphywebdev.com) — interactive tour of real captured exchanges for each of the 6 tools, plus a full live-Claude session.

## The problem

A dispatcher at a 12-person field-services company juggles a queue of incoming requests, a roster of techs with overlapping skills, a moving schedule, and a list of customers expecting a real reply within minutes. An LLM is well-suited to most of that workflow — *if* it can read the queue, search the schedule, mutate state, draft customer-ready messages from real fixture data, run a utilization roll-up, and ask for human help when it should not act on its own.

That's the problem this server solves: it gives an MCP-speaking client (Claude, Claude Desktop, Cline, the Anthropic SDK, etc.) a tool surface a hiring manager can drive in one sitting.

## What it does

`fieldops-mcp` exposes six tools, each chosen to exercise a distinct *shape* an FDE has to design for:

| Tool | Shape | What it returns |
| --- | --- | --- |
| `list_open_jobs` | Read with optional filters | The dispatch queue, sorted urgent first |
| `find_available_techs` | Search across two indexes | Techs whose skill matches *and* whose shift overlaps the requested window, ranked by free minutes |
| `assign_job` | Mutation with typed conflict errors | Updated job — or a structured `conflict` error explaining why not |
| `draft_customer_message` | Composition grounded in real state | A confirmation / delay / reschedule message templated from the customer, tech, and job |
| `compute_utilization` | Aggregation | Per-tech load + capacity gap over a forward window |
| `flag_for_human` | Escalation / refusal | Marks the job for the dispatcher's review queue |

The server is in-memory, loads synthetic SMB fixtures on boot, and speaks MCP over stdio.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | [Bun](https://bun.com) | Native TypeScript, no transpile step |
| Language | TypeScript (strict) | Type discipline carries through to tool schemas |
| Tool protocol | [`@modelcontextprotocol/sdk`](https://modelcontextprotocol.io/) | Anthropic-introduced standard for agent tool use |
| LLM (smoke) | [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk) | Drives the optional live transcript |
| Validation | [Zod](https://zod.dev) | Already the SDK's input-schema language |
| Tests | `bun:test` | Same runtime, no extra deps |

Zero deps beyond those four. No Express, no dotenv, no nodemon.

## Getting started

```bash
# Install
bun install

# Typecheck and run unit tests
bun run typecheck
bun test

# Run the deterministic smoke (no API key required)
bun run smoke

# Run the live Claude smoke (optional; requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=... bun run smoke

# Connect from an MCP-speaking client
bun run start  # speaks MCP on stdio
```

Configure Claude Desktop to launch the server by adding to its MCP config:

```json
{
  "mcpServers": {
    "fieldops": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/fieldops-mcp/src/server.ts"]
    }
  }
}
```

## Example transcript

A dispatcher's morning. The agent triages the queue, finds an HVAC tech, books them, drafts a confirmation, runs a utilization roll-up, and flags an ambiguous job. (Captured by `bun run smoke`; full output in [`docs/TRANSCRIPTS.md`](./docs/TRANSCRIPTS.md).)

```text
> list_open_jobs({"priority":"urgent"})
{ "jobs": [
    { "id": "J-2001", "description": "Rooftop AC unit not cooling, multiple tenant complaints", "required_skill": "hvac", "priority": "urgent", "status": "open", ... },
    { "id": "J-2004", "description": "Walk-in cooler temperature drifting above safe threshold", ... },
    { "id": "J-2002", "description": "Front-of-house outlet sparking when load applied", ... }
] }

> find_available_techs({"skill":"hvac","window_start":"2026-05-12T13:00:00Z","window_end":"2026-05-12T16:00:00Z"})
{ "matches": [
    { "tech": { "id": "T-01", "display_name": "Tech A.M.", ... }, "free_minutes_in_window": 180 },
    { "tech": { "id": "T-02", "display_name": "Tech B.K.", ... }, "free_minutes_in_window": 180 },
    ...
] }

> assign_job({"job_id":"J-2001","tech_id":"T-01","scheduled_at":"2026-05-12T13:00:00Z"})
{ "job": { "id": "J-2001", "status": "scheduled", "assigned_tech_id": "T-01", ... } }

> draft_customer_message({"job_id":"J-2001","intent":"confirmation"})
{
  "channel": "email",
  "subject": "Confirmed: visit on Tue, 12 May 2026 13:00:00 GMT",
  "body": "Hi Maple Ridge Apartments — confirming Tech A.M. for \"Rooftop AC unit not cooling, multiple tenant complaints\" on Tue, 12 May 2026 13:00:00 GMT. ..."
}

> compute_utilization({"window_days":7})
{ "rows": [ ... per-tech load ... ], "capacity_gap_minutes": 0 }

> flag_for_human({"job_id":"J-2011","reason":"Customer mentioned a part number we don't recognize; needs human triage"})
{ "job": { "id": "J-2011", "status": "flagged", "flag_reason": "...", ... } }
```

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — module boundaries and the six tool shapes
- [`docs/TOOL_DESIGN.md`](./docs/TOOL_DESIGN.md) — heuristics for adding, modifying, or rejecting tools
- [`docs/FIXTURES.md`](./docs/FIXTURES.md) — synthetic-data conventions
- [`docs/TRANSCRIPT_PROTOCOL.md`](./docs/TRANSCRIPT_PROTOCOL.md) — how transcripts stay aligned with real behavior
- [`docs/TRANSCRIPTS.md`](./docs/TRANSCRIPTS.md) — full captured agent runs
- [`docs/DESIGN_NOTES.md`](./docs/DESIGN_NOTES.md) — non-obvious decisions and the parking lot

## Companion project

[`fedbench`](https://github.com/midimurphdesigns/fedbench) is the sibling artifact: an evaluation harness for grounded LLM Q&A over policy and benefits PDFs. fedbench measures *whether the model is right*; fieldops-mcp shapes *what the model can do*.

## Author

Kevin Murphy — [kevinmurphywebdev.com](https://kevinmurphywebdev.com) · [GitHub](https://github.com/midimurphdesigns) · [LinkedIn](https://www.linkedin.com/in/midimurphdesigns)
