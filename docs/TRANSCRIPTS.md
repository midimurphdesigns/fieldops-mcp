# Transcripts

Three example sessions against `fieldops-mcp`. Transcripts 1 and 3 are deterministic (captured by `bun run smoke`, no LLM); transcript 2 is a live Claude session captured with `ANTHROPIC_API_KEY` set.

> Transcripts are regenerated whenever the tool surface changes. If you fork and modify a tool, run `bun run smoke > docs/TRANSCRIPTS.md.tmp` and reconcile.

---

## Transcript 1 — Triage and assignment (deterministic)

The dispatcher's morning. Three urgent jobs land in the queue. The agent triages, finds an HVAC tech for the most urgent, books them, drafts a confirmation, runs a utilization roll-up, and flags an ambiguous job for human review.

```
Server advertises 6 tools:
  - list_open_jobs
  - find_available_techs
  - assign_job
  - draft_customer_message
  - compute_utilization
  - flag_for_human

> list_open_jobs({"priority":"urgent"})
{
  "jobs": [
    { "id": "J-2001", "description": "Rooftop AC unit not cooling, multiple tenant complaints", "required_skill": "hvac", "priority": "urgent", "status": "open", ... },
    { "id": "J-2004", "description": "Walk-in cooler temperature drifting above safe threshold", "required_skill": "hvac", "priority": "urgent", "status": "open", ... },
    { "id": "J-2002", "description": "Front-of-house outlet sparking when load applied", "required_skill": "electrical", "priority": "urgent", "status": "open", ... }
  ]
}

> find_available_techs({"skill":"hvac","window_start":"2026-05-12T13:00:00Z","window_end":"2026-05-12T16:00:00Z"})
{
  "matches": [
    { "tech": { "id": "T-01", "display_name": "Tech A.M.", "skills": ["hvac","diagnostic"], ... }, "free_minutes_in_window": 180 },
    { "tech": { "id": "T-02", "display_name": "Tech B.K.", "skills": ["hvac","electrical"], ... }, "free_minutes_in_window": 180 },
    { "tech": { "id": "T-05", "display_name": "Tech E.N.", "skills": ["hvac"], ... }, "free_minutes_in_window": 180 },
    { "tech": { "id": "T-08", "display_name": "Tech H.L.", "skills": ["plumbing","hvac"], ... }, "free_minutes_in_window": 180 }
  ]
}

> assign_job({"job_id":"J-2001","tech_id":"T-01","scheduled_at":"2026-05-12T13:00:00Z"})
{
  "job": {
    "id": "J-2001",
    "status": "scheduled",
    "scheduled_at": "2026-05-12T13:00:00Z",
    "assigned_tech_id": "T-01",
    ...
  }
}

> draft_customer_message({"job_id":"J-2001","intent":"confirmation"})
{
  "channel": "email",
  "subject": "Confirmed: visit on Tue, 12 May 2026 13:00:00 GMT",
  "body": "Hi Maple Ridge Apartments — confirming Tech A.M. for \"Rooftop AC unit not cooling, multiple tenant complaints\" on Tue, 12 May 2026 13:00:00 GMT. Reply if anything changes on your end."
}

> compute_utilization({"window_days":7})
{
  "rows": [
    { "tech_id": "T-01", "display_name": "Tech A.M.", "scheduled_minutes": 120, "shift_minutes": 3780, "utilization_pct": 3.2, "open_skill_demand": 345 },
    { "tech_id": "T-02", "display_name": "Tech B.K.", "scheduled_minutes": 0,   "shift_minutes": 3780, "utilization_pct": 0,   "open_skill_demand": 330 },
    ...
  ],
  "capacity_gap_minutes": 0
}

> flag_for_human({"job_id":"J-2011","reason":"Customer mentioned a part number we don't recognize; needs human triage"})
{
  "job": {
    "id": "J-2011",
    "status": "flagged",
    "flag_reason": "Customer mentioned a part number we don't recognize; needs human triage",
    ...
  }
}
```

What this transcript shows:

- **Sorted output** — `list_open_jobs` returned urgent first, oldest-first within priority. The agent did no sorting work.
- **Cross-reference search** — `find_available_techs` joined skill set against the schedule and ranked by free minutes.
- **Mutation with structured success** — `assign_job` returned the updated job, so the agent has the new state without a follow-up read.
- **Grounded composition** — `draft_customer_message` pulled the customer name, the tech, and the job description from the store. The model never invented a name.
- **Aggregation** — `compute_utilization` returned per-tech roll-up plus a capacity-gap summary.
- **Constructive refusal** — `flag_for_human` turned an ambiguous request into a queue item rather than a guess.

---

## Transcript 2 — Live Claude session

> Run with `ANTHROPIC_API_KEY=… bun run smoke` to regenerate. Captured output goes here.

(Awaiting capture; CI does not run this mode to keep the build free of inference cost.)

---

## Transcript 3 — Conflict path (deterministic)

Demonstrates that mutating tools fail loudly with typed errors instead of silently corrupting state.

```
> assign_job({"job_id":"J-2003","tech_id":"T-04","scheduled_at":"2026-05-12T13:00:00Z"})
{
  "error": "conflict",
  "message": "tech T-04 lacks required skill 'hvac'"
}

> assign_job({"job_id":"J-2003","tech_id":"T-01","scheduled_at":"2026-05-12T13:00:00Z"})
{ "job": { "id": "J-2003", "status": "scheduled", "assigned_tech_id": "T-01", ... } }

> assign_job({"job_id":"J-2004","tech_id":"T-01","scheduled_at":"2026-05-12T13:30:00Z"})
{
  "error": "conflict",
  "message": "tech T-01 already booked 2026-05-12T13:00:00Z for job J-2003"
}
```

The agent receives `isError: true` on the MCP response with a stable `{ error, message }` shape. That's the affordance an LLM client needs to reroute (try a different tech, suggest a different time, or escalate) instead of silently no-op-ing.
