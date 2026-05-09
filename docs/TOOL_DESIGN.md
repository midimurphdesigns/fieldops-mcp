# Tool design heuristics

Rules of thumb the maintainers apply when adding, modifying, or rejecting tools. Captured here so a contributor can read them once and propose changes that have a chance of being accepted.

## When to add a new tool

A new tool earns its place when **it exposes a capability the agent cannot reasonably compose from the existing surface**. If the agent can already do the thing in two existing calls, the answer is usually "use the two existing calls."

Add a tool when:

1. **The composition is non-obvious.** Two reads + a transform that an LLM would mis-compute (rounding, time math, joins) is worth wrapping.
2. **The composition would require N calls where N is unbounded.** Fetching a list and then fetching each item to filter is a tool-shape problem.
3. **A new shape is missing.** If the surface has read, search, and mutation but no aggregation, an aggregation tool earns its place even if redundant in principle.
4. **Refusal/escalation needs a target.** If the agent has a class of cases it should not act on, give it a place to put them.

Reject a tool when:

- It is a thin wrapper over one existing tool with one filter rebound.
- It models an idea ("happiness", "best") whose definition is outside the data.
- It returns data we already return inside another tool's response.
- It is "would be nice for the demo" rather than "is needed by the workflow."

## Input schemas

- **Required vs optional follows necessity.** Optional inputs default to "all" or "no filter" — never to a magic value the caller has to know.
- **Enums over free-form strings** wherever the value set is closed. `priority`, `intent`, `skill`, `status` are enums. The schema does the rejecting; the handler doesn't re-validate.
- **Time inputs are ISO-8601 strings.** No epoch seconds, no "last_3_days" magic. The agent can compute a window if it needs one.
- **No nested input schemas** unless the wire format genuinely calls for it. Flat shapes are easier for LLM clients to construct correctly.

## Output schemas

- **Wrap collections in a named field** (`{ jobs: [...] }`, not `[...]`). This leaves room for sibling metadata (`{ jobs: [...], next_cursor: "..." }`) without a breaking change.
- **Return the post-mutation entity** from mutating tools. The agent should not need a follow-up read to know what state it's in.
- **Sort or rank.** If the agent could plausibly want output ordered, the tool decides the order. Don't make the model sort.
- **No nulls inside arrays.** Use empty arrays. Nulls in arrays force defensive coding in clients.

## Error shape

- Throw typed errors at the handler boundary; the server maps them to `{ error, message }`.
- Error categories are stable: `not_found`, `conflict`, `validation`, `internal`. Adding a new category is a wire-format change.
- Messages are human-readable but **deterministic** — same input produces same message. Models match on substring; flapping messages defeat that.

## Idempotency

- Read tools are idempotent by definition. State this explicitly in the description.
- Mutating tools are *not* idempotent unless we make them so. `assign_job` called twice with identical args on an unchanged job will succeed both times (no-op-ish), but `flag_for_human` will overwrite the reason. State the contract in the tool description so clients know what to expect.

## Description text

The `description` field is read by the model and used to choose when to call the tool. Treat it as production prompt, not API doc:

- Lead with the *use case* in one sentence.
- Mention any non-obvious side effect ("Mutating; rejects on …").
- Include a one-line "use this rather than …" pointer if there's a temptation to free-form the same result.
- No internal jargon, no acronyms the model can't decode.
