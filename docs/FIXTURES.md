# Fixture conventions

`src/fixtures/data.json` is the single source of truth for the synthetic SMB world the server simulates. Tests, transcripts, and the README example all depend on it. Keep these rules in mind when extending it.

## Naming

- **Techs** are `T-NN`. Display names are first-initial + last-initial only (`Tech A.M.`, `Tech B.K.`). Never use real-feeling full names — the data is fictional and should read as fictional.
- **Customers** are `C-NNN`. Display names are clearly invented business names: `Cedar Hollow Bakery`, `Maple Ridge Apartments`. No real businesses, no places that resolve to a real address.
- **Jobs** are `J-NNNN`. IDs are monotonic for readability; gaps are fine.
- **History** entries are `H-NNNN`.

## Job descriptions

- Read like a dispatcher's intake note, not a marketing brochure. "AC unit not cooling, multiple tenant complaints" — not "luxury HVAC restoration project."
- Include a hint at the symptom and any contextual urgency. The `draft_customer_message` tool quotes these verbatim, so they should pass as legitimate customer-facing text.
- No real model numbers or part numbers. If the description needs one, use a fictional one or describe the part class.

## Skills, regions, and priorities

- Skills are `hvac | electrical | plumbing | solar | diagnostic`. Adding a new skill requires updating `Skill` in `src/types.ts` and at least one tech who has it.
- Regions are `north | central | south`. Used for future routing logic; not currently consulted by tools.
- Priorities are `low | normal | urgent`. Distribution should bias to `normal`; one or two `urgent` per fixture set to keep the queue interesting.

## Statuses

- `open` jobs have `assigned_tech_id: null` and `scheduled_at: null`.
- `scheduled` jobs have both populated and a future `scheduled_at`.
- `completed` jobs are not currently emitted by the server. If you add a `mark_completed` tool, mirror the assignment fields and add a history entry.
- `flagged` jobs have a non-null `flag_reason`.

## Time

- All timestamps are ISO-8601 with `Z`. No local zones in the fixture.
- Tech `shift_start_local` / `shift_end_local` are 24-hour `HH:MM` strings. The store treats them as UTC for shift-window arithmetic; the fictional company is in one zone.
- Pick fixture dates within a one-week window of the current "today" so tests that check upcoming-window logic stay live for years rather than going stale on calendar drift. (When in doubt, pick dates a few days out from when you wrote the fixture.)

## Test impact

These IDs are referenced by the test suite directly:

- `J-2001` — the canonical "urgent rooftop HVAC" example used in transcripts.
- `J-2003` — used as the reassignment target in `assign_job` happy-path tests.
- `J-2008`, `J-2009` — already-scheduled jobs used in conflict tests.
- `J-2010` — used as a skill-mismatch case (solar work, attempted assignment to a plumbing tech).
- `J-2011` — used as the flag-for-human case in transcripts.

If you renumber or delete any of these, update the corresponding tests in `test/`.

## Size

Keep the fixture small (≤ ~30 jobs, ≤ ~10 techs). Realistic SMB scale, fast tests, readable diffs. Larger fixtures are a different kind of project; this one optimizes for "a hiring manager can read the data file and understand the world in 30 seconds."
