# Architecture

`fieldops-mcp` is an MCP server that exposes a small-business field-services workflow as agent tools. It speaks the [Model Context Protocol](https://modelcontextprotocol.io/) over stdio, so any MCP client (Claude Desktop, the Anthropic SDK, Cline, etc.) can drive it.

## Module boundaries

```
src/
├── server.ts          # MCP entry: registers each tool, opens stdio transport
├── tools/             # one file per tool — each exports {name, description, inputSchema, handler}
│   └── index.ts       # tool registry consumed by server.ts
├── store.ts           # in-memory state with mutating helpers (assignJob, flagJob)
├── fixtures/data.json # synthetic SMB seed data
├── types.ts           # Job, Tech, Customer, HistoryEntry, Skill, Priority, JobStatus
└── errors.ts          # NotFoundError, ConflictError, ValidationError + toToolError mapper
```

The server has no I/O beyond the stdio transport. The store is in-memory and never persists. Mutations are visible across calls within a single `bun run start` process and reset to fixture state on restart. That's a deliberate scope choice — see [`DESIGN_NOTES.md`](./DESIGN_NOTES.md).

## The six tool shapes

The tool surface is intentionally chosen so each tool exercises a different shape an FDE has to design for:

| Tool | Shape | Why this shape matters |
| --- | --- | --- |
| `list_open_jobs` | Read with optional filters | Most agent workflows start with situational awareness. Sorted output makes the agent's first move deterministic. |
| `find_available_techs` | Search + cross-reference | Two indexes (skill, time) collapse into one ranked result. Models how an FDE turns "join two tables" into one tool call. |
| `assign_job` | Mutation with typed conflict errors | Forces the agent to handle rejection paths (skill mismatch, double-booking, off-shift) instead of optimistic writes. |
| `draft_customer_message` | Composition with grounded context | The agent does not free-form a customer message; the tool pulls real customer + tech + job state and templates the body. The agent picks intent, the tool picks substance. |
| `compute_utilization` | Aggregation / analysis | Read-only aggregate. Demonstrates that not every tool call is a read of a single record or a write of a single record — operators want roll-ups. |
| `flag_for_human` | Escalation / refusal | Refusal is a feature. Giving the agent an explicit "I should not act on this" tool is the design choice that prevents quiet hallucinated mutations. |

## Error model

Tool handlers throw typed errors (`NotFoundError`, `ConflictError`, `ValidationError`). The server catches them at the registration boundary in `server.ts`, maps them through `toToolError` to a stable wire shape:

```json
{ "error": "conflict", "message": "tech T-01 already booked 2026-05-12T13:00:00Z for job J-2003" }
```

…and sets `isError: true` on the MCP response. Clients (Anthropic, Cline, etc.) see this as a tool error and the model can react.

## Stdio over child process

The smoke script (`scripts/smoke.ts`) connects via `StdioClientTransport`, which spawns `bun run src/server.ts` as a child. That mirrors how every real MCP client connects, so the smoke is a faithful integration test rather than an in-process shortcut.
