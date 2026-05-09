# Design notes

Non-obvious decisions and what's intentionally out of scope.

## Decisions

### In-memory store, no persistence

The store loads fixtures on boot and discards mutations on exit. This is the right v0.1 trade-off: persistence would force schema-versioning, a migration story, and a backup story, none of which advance the core thesis (designing a tool surface). Adding persistence is a Phase-2 problem that should not block the MCP shape.

### Six tools, not three, not twelve

Three tools is too thin to demonstrate *shape diversity* — read-only servers are common. Twelve drifts into demoware. Six is the smallest set that covers read, search, mutation, composition, analysis, and escalation as distinct shapes.

### Composition tool returns text only

`draft_customer_message` does not send. The boundary is intentional: a tool that *sends* is one that you cannot undo from the agent's side, and any responsible deployment needs a human-in-the-loop send step. The tool's job is to ground the message in real fixture state; the dispatcher's job is to send it.

### Refusal is a tool, not a model behavior

`flag_for_human` exists so the agent has a *constructive* alternative to guessing. Without it, "I'm not sure" tends to collapse into either silent hallucination or a refusal-shaped text response that the operator has no way to triage. Making escalation a first-class tool turns ambiguity into a queue item.

### Errors are typed, not stringly

`ConflictError`, `NotFoundError`, `ValidationError` carry intent. The server maps them to a stable JSON shape at the boundary so a model client can reason about them programmatically.

### Bun + Zod, no other runtime deps

Bun gives native TypeScript and a fast test runner. Zod is the only validation library because the MCP SDK already speaks it. No Express, no dotenv, no nodemon. Every dependency you don't add is a dependency you don't have to defend.

## Out of scope (parking lot)

These ideas are explicitly *not* in v0.1 — listing them keeps contributors from re-inventing them and tells reviewers what we've already considered.

- **Persistence.** Nothing is written to disk. SQLite via `bun:sqlite` is the obvious next step but adds migration scope.
- **Auth / multi-tenancy.** Single tenant by construction. Adding auth to an MCP server is a separate design problem.
- **Planner-style agent layer.** This repo ships *tools*. The agent is the client (Claude, Cline, Claude Desktop). Building an in-repo planner would conflate the surface and the consumer.
- **Eval harness.** Companion repo [`fedbench`](https://github.com/midimurphdesigns/fedbench) is the eval-rigor artifact. Mixing eval logic in here would muddy both projects.
- **Web UI / dashboard.** The dispatcher's UI is whatever MCP client they use.
- **Real notification send paths (SMS / email).** `draft_customer_message` returns text; sending is a different repo.
- **Geofencing / route optimization.** Skill + time are enough to demonstrate the shape; routing is a different domain problem.
- **npm publish.** The repo is the artifact; the package is not.
