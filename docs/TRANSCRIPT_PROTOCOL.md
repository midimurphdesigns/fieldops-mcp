# Transcript capture protocol

`docs/TRANSCRIPTS.md` is a recruiter-read artifact. It must reflect actual server behavior, not aspirational behavior. This file describes how transcripts are captured and refreshed.

## When to refresh

Refresh transcripts whenever any of the following changes:

- A tool's name, input schema, output schema, or description.
- Fixture data referenced in a transcript (`J-2001`, `T-01`, customer names).
- The error shape returned on tool failure.

The CI build does not regenerate transcripts. Refreshing is a deliberate manual step so transcripts stay narratively coherent.

## Capture command

```bash
# Deterministic transcripts (Transcripts 1 and 3)
bun run smoke > /tmp/fieldops-smoke.txt

# Live Claude transcript (Transcript 2)
ANTHROPIC_API_KEY=... bun run smoke 2>&1 | tee /tmp/fieldops-smoke-live.txt
```

The deterministic mode is byte-stable across runs (no timestamps in output beyond the fixture's own ISO strings). The live mode varies by sampling.

## Editing rules

- **No silent rewrites.** If a transcript no longer matches captured output, regenerate it from a real run. Do not hand-edit values.
- **Truncation is allowed.** Long JSON blocks may be elided with `...` for readability, but never inserted with fake fields. If you elide, keep enough that a reader can reconstruct the shape.
- **Never invent a tool call.** Every `> tool_name(args)` line in the doc must correspond to a real call captured in a smoke run.
- **Live transcripts redact nothing.** The fixture data is synthetic; there is nothing to redact. If a future change adds anything sensitive (it should not), refuse to merge.

## Live-mode caveats

The live Claude transcript varies between runs. To keep the doc honest:

- Capture a single representative run rather than averaging or cherry-picking.
- If the captured run has obviously degenerate behavior (e.g., the model assigns the wrong tech), capture again. Do not paper over it in the doc.
- Note the model name and date at the top of the transcript: `Captured 2026-05-12 with claude-sonnet-4-5`.

## What lives where

| Location | Purpose |
| --- | --- |
| `scripts/smoke.ts` | The actual capture mechanism. Deterministic mode is the source of truth for transcripts 1 and 3. |
| `docs/TRANSCRIPTS.md` | The recruiter-read narrative wrapping the captured output. |
| `README.md` | A *single* abbreviated transcript, linked through to `TRANSCRIPTS.md` for the full set. |

If `README.md` and `TRANSCRIPTS.md` ever disagree, `TRANSCRIPTS.md` is canonical and the README is wrong.
