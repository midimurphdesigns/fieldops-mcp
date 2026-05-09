# CLAUDE.md

Project guide for AI coding assistants. Read this before writing code in this repo.

## Project

`fieldops-mcp` is an MCP server that exposes a synthetic small-business field-services workflow as agent tools. It speaks MCP over stdio so any MCP-speaking client can drive it.

Project context lives in [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — module boundaries and the six tool shapes
- [`docs/TOOL_DESIGN.md`](./docs/TOOL_DESIGN.md) — heuristics for adding, modifying, or rejecting tools
- [`docs/FIXTURES.md`](./docs/FIXTURES.md) — synthetic-data conventions
- [`docs/TRANSCRIPT_PROTOCOL.md`](./docs/TRANSCRIPT_PROTOCOL.md) — how transcripts stay aligned with real behavior
- [`docs/TRANSCRIPTS.md`](./docs/TRANSCRIPTS.md) — full captured agent runs
- [`docs/DESIGN_NOTES.md`](./docs/DESIGN_NOTES.md) — non-obvious decisions and the parking lot

Read these before proposing structural changes.

## Engineering rules

- **TypeScript strict mode.** No `any`. Use `type` over `interface` for object shapes. Errors are typed.
- **Open-source dependencies only.** No SaaS lock-in. The runtime, the SDK, the validator, the test runner are all self-hostable.
- **Zero deps beyond essentials.** Bun, the MCP SDK, the Anthropic SDK (smoke only), Zod. Anything else is a justification ticket.
- **Refusal is a feature.** `flag_for_human` exists so the agent has a constructive alternative to guessing. Don't remove it.
- **Mutating tools fail loudly.** Conflicts, missing IDs, and validation problems throw typed errors and surface as `{ error, message }` on the wire.
- **Transcripts must reflect real runs.** Hand-editing `docs/TRANSCRIPTS.md` to fix a regression is a bug, not a fix. Re-capture instead.

## Code quality

- Code is documentation; well-named identifiers replace most comments. Comments explain *why*, never *what*.
- No premature abstraction. Six tools does not justify a `ToolFactory`.
- No marketing prose in code or in the README. Write what the thing does.
- Errors are typed and handled at boundaries.

## Stack

Use Bun for everything: runtime, package manager, test runner, scripts.

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun test` instead of `jest` or `vitest`
- `bun install` instead of `npm install` / `yarn` / `pnpm`
- `bun run <script>` instead of `npm run <script>`
- `bunx <package>` instead of `npx <package>`
- Bun loads `.env` automatically; no `dotenv` import.

### Bun APIs to prefer

- `Bun.file` over `node:fs` for read/write.
- `Bun.serve()` over `express` for HTTP.
- `bun:sqlite` over `better-sqlite3`.

### Testing

```ts
import { test, expect } from "bun:test";

test("hello", () => {
  expect(1).toBe(1);
});
```

Unit tests live in `test/`, one file per tool. Each tool gets at least a happy-path case and a failure-mode case. Add a test before shipping a change to a tool's input schema or output shape.

## Tool surface (do not extend casually)

The six tools were chosen for shape diversity, not feature count. Before adding a seventh, read [`docs/TOOL_DESIGN.md`](./docs/TOOL_DESIGN.md). The bar is "exposes a capability the agent cannot reasonably compose from the existing surface" — not "would be cool."

If you add or modify a tool:

1. Update its handler and tests in `src/tools/` and `test/`.
2. Update its description text — the model reads it to choose when to call the tool.
3. If its input or output schema changes, regenerate transcripts (`bun run smoke > /tmp/...`) and update `docs/TRANSCRIPTS.md`.
4. If a fixture row referenced by tests changes, update [`docs/FIXTURES.md`](./docs/FIXTURES.md).

## Commit style

- Conventional: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`, `refactor:`.
- One conceptual change per commit.
- Commit messages explain *why* the change was made, not *what* changed (the diff shows what).
