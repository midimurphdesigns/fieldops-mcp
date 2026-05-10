/**
 * Transcript data — six tool-by-tool exchanges captured from the
 * deterministic smoke run + the live Claude Sonnet 4.6 session
 * documented in docs/TRANSCRIPTS.md.
 *
 * Every entry is real output. Nothing is fabricated. The visitor
 * sees what an MCP host (Claude Desktop, Cursor, Claude Code CLI)
 * actually receives when these tools are exposed.
 */

export type TranscriptStep =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool-call"; name: string; args: Record<string, unknown> }
  | { kind: "tool-result"; json: unknown }
  | { kind: "tool-error"; error: string; message: string };

export type ToolShowcase = {
  slug: string;
  name: string;
  shape: string;
  oneLiner: string;
  designNote: string;
  steps: TranscriptStep[];
};

export const TOOLS: ToolShowcase[] = [
  {
    slug: "list_open_jobs",
    name: "list_open_jobs",
    shape: "Read",
    oneLiner: "Read the queue, optionally filtered, sorted urgent-first.",
    designNote:
      "Returns a typed list pre-sorted by priority then age. The agent does no sorting work — the tool is opinionated about ordering so the model's prompt budget is spent on judgment, not on collation.",
    steps: [
      {
        kind: "tool-call",
        name: "list_open_jobs",
        args: { priority: "urgent" },
      },
      {
        kind: "tool-result",
        json: {
          jobs: [
            {
              id: "J-2001",
              description: "Rooftop AC unit not cooling, multiple tenant complaints",
              required_skill: "hvac",
              priority: "urgent",
              status: "open",
              customer_id: "C-103",
              estimated_minutes: 120,
            },
            {
              id: "J-2004",
              description: "Walk-in cooler temperature drifting above safe threshold",
              required_skill: "hvac",
              priority: "urgent",
              status: "open",
              customer_id: "C-107",
              estimated_minutes: 90,
            },
            {
              id: "J-2002",
              description: "Front-of-house outlet sparking when load applied",
              required_skill: "electrical",
              priority: "urgent",
              status: "open",
              customer_id: "C-104",
              estimated_minutes: 60,
            },
          ],
        },
      },
    ],
  },
  {
    slug: "find_available_techs",
    name: "find_available_techs",
    shape: "Search & rank",
    oneLiner:
      "Cross-reference techs by skill against the schedule, return matches ranked by free minutes in the window.",
    designNote:
      "This is the join the model would otherwise have to do by hand on a list result, badly. Search-and-rank as a single tool turns 'reasoning' into 'reading' — the model picks the right tech using ranked output, instead of trying to mentally intersect skill sets and schedules.",
    steps: [
      {
        kind: "tool-call",
        name: "find_available_techs",
        args: {
          skill: "hvac",
          window_start: "2026-05-09T13:00:00Z",
          window_end: "2026-05-09T16:00:00Z",
        },
      },
      {
        kind: "tool-result",
        json: {
          matches: [
            {
              tech: { id: "T-01", display_name: "Tech A.M.", skills: ["hvac", "diagnostic"] },
              free_minutes_in_window: 180,
            },
            {
              tech: { id: "T-02", display_name: "Tech B.K.", skills: ["hvac", "electrical"] },
              free_minutes_in_window: 180,
            },
            {
              tech: { id: "T-08", display_name: "Tech H.L.", skills: ["plumbing", "hvac"] },
              free_minutes_in_window: 180,
            },
            {
              tech: { id: "T-05", display_name: "Tech E.N.", skills: ["hvac"] },
              free_minutes_in_window: 120,
            },
          ],
        },
      },
      {
        kind: "assistant",
        text:
          "I have 4 available HVAC techs. J-2001 requires 120 minutes, and Tech E.N. has exactly 120 free minutes while the others have 180. I'll assign Tech A.M. (T-01) to give us more buffer.",
      },
    ],
  },
  {
    slug: "assign_job",
    name: "assign_job",
    shape: "Mutation with typed errors",
    oneLiner:
      "Book a tech, rejects on skill mismatch or schedule conflict with a typed error.",
    designNote:
      "The interesting half is the failure path. The agent gets a stable { error, message } shape on conflict instead of a silent no-op — that's the affordance an LLM client needs to reroute (try a different tech, suggest a different time, escalate). Two captured failures below, then a successful retry.",
    steps: [
      {
        kind: "tool-call",
        name: "assign_job",
        args: {
          job_id: "J-2003",
          tech_id: "T-04",
          scheduled_at: "2026-05-12T13:00:00Z",
        },
      },
      {
        kind: "tool-error",
        error: "conflict",
        message: "tech T-04 lacks required skill 'hvac'",
      },
      {
        kind: "tool-call",
        name: "assign_job",
        args: {
          job_id: "J-2003",
          tech_id: "T-01",
          scheduled_at: "2026-05-12T13:00:00Z",
        },
      },
      {
        kind: "tool-result",
        json: {
          job: {
            id: "J-2003",
            status: "scheduled",
            assigned_tech_id: "T-01",
            scheduled_at: "2026-05-12T13:00:00Z",
          },
        },
      },
      {
        kind: "tool-call",
        name: "assign_job",
        args: {
          job_id: "J-2004",
          tech_id: "T-01",
          scheduled_at: "2026-05-12T13:30:00Z",
        },
      },
      {
        kind: "tool-error",
        error: "conflict",
        message: "tech T-01 already booked 2026-05-12T13:00:00Z for job J-2003",
      },
    ],
  },
  {
    slug: "draft_customer_message",
    name: "draft_customer_message",
    shape: "Composition",
    oneLiner:
      "Compose a confirmation, delay, or reschedule message grounded in real customer + tech + job data.",
    designNote:
      "The model picks the *intent*; the tool picks the *substance*. The customer-facing message quotes the real customer name, the real tech name, and the real job description — pulled from the store, not invented by the model. Crucially, it does NOT send. Returning text instead of dispatching means a human-in-the-loop send step is structural.",
    steps: [
      {
        kind: "tool-call",
        name: "draft_customer_message",
        args: { job_id: "J-2001", intent: "confirmation" },
      },
      {
        kind: "tool-result",
        json: {
          channel: "email",
          subject: "Confirmed: visit on Sat, 09 May 2026 13:00:00 GMT",
          body:
            'Hi Maple Ridge Apartments — confirming Tech A.M. for "Rooftop AC unit not cooling, multiple tenant complaints" on Sat, 09 May 2026 13:00:00 GMT. Reply if anything changes on your end.',
        },
      },
    ],
  },
  {
    slug: "compute_utilization",
    name: "compute_utilization",
    shape: "Aggregation",
    oneLiner: "Per-tech load over a forward window, plus a capacity-gap summary.",
    designNote:
      "Math the model would do with non-trivial error. The tool returns rows with utilization percentages plus a single roll-up scalar (capacity_gap_minutes) so the model can answer 'do we have enough capacity?' with one read instead of summing rows.",
    steps: [
      {
        kind: "tool-call",
        name: "compute_utilization",
        args: { window_days: 7 },
      },
      {
        kind: "tool-result",
        json: {
          rows: [
            {
              tech_id: "T-01",
              display_name: "Tech A.M.",
              scheduled_minutes: 120,
              shift_minutes: 3780,
              utilization_pct: 3.2,
              open_skill_demand: 345,
            },
            {
              tech_id: "T-02",
              display_name: "Tech B.K.",
              scheduled_minutes: 0,
              shift_minutes: 3780,
              utilization_pct: 0,
              open_skill_demand: 330,
            },
            {
              tech_id: "T-05",
              display_name: "Tech E.N.",
              scheduled_minutes: 0,
              shift_minutes: 3780,
              utilization_pct: 0,
              open_skill_demand: 195,
            },
            {
              tech_id: "T-08",
              display_name: "Tech H.L.",
              scheduled_minutes: 0,
              shift_minutes: 3780,
              utilization_pct: 0,
              open_skill_demand: 375,
            },
          ],
          capacity_gap_minutes: 0,
        },
      },
    ],
  },
  {
    slug: "flag_for_human",
    name: "flag_for_human",
    shape: "Constructive refusal / escalation",
    oneLiner: "Escalate ambiguous cases to the dispatcher's review queue rather than guess.",
    designNote:
      "An explicit escalation tool is more honest than asking the model to refuse via prompt. The refusal is *visible* in the tool-call log, the dispatcher gets a queue item they can act on, and the behavior is gated by something stronger than instruction-following. Refusal as an affordance, not a string.",
    steps: [
      {
        kind: "tool-call",
        name: "flag_for_human",
        args: {
          job_id: "J-2011",
          reason: "Customer mentioned a part number we don't recognize; needs human triage",
        },
      },
      {
        kind: "tool-result",
        json: {
          job: {
            id: "J-2011",
            status: "flagged",
            flag_reason:
              "Customer mentioned a part number we don't recognize; needs human triage",
          },
        },
      },
    ],
  },
];

export const FULL_SESSION: TranscriptStep[] = [
  {
    kind: "user",
    text:
      "Three urgent HVAC requests came in this morning. Triage the queue, find an available HVAC tech for J-2001 in the 13:00–16:00 UTC window today, assign them, draft a confirmation message to the customer, then run a utilization check for the next 7 days. If anything looks ambiguous, flag for a human.",
  },
  {
    kind: "assistant",
    text:
      "I'll help you triage the urgent HVAC requests and handle J-2001. Let me start by checking the queue and then proceed with the assignment.",
  },
  { kind: "tool-call", name: "list_open_jobs", args: { priority: "urgent" } },
  {
    kind: "tool-result",
    json: {
      jobs: [
        { id: "J-2001", description: "Rooftop AC unit not cooling…", required_skill: "hvac" },
        { id: "J-2004", description: "Walk-in cooler drifting…", required_skill: "hvac" },
        { id: "J-2002", description: "Front-of-house outlet sparking…", required_skill: "electrical" },
      ],
    },
  },
  {
    kind: "assistant",
    text:
      "Two are HVAC (J-2001 and J-2004) and one is electrical (J-2002). Let me find an available HVAC tech for J-2001 in today's 13:00–16:00 UTC window.",
  },
  {
    kind: "tool-call",
    name: "find_available_techs",
    args: {
      skill: "hvac",
      window_start: "2026-05-09T13:00:00Z",
      window_end: "2026-05-09T16:00:00Z",
    },
  },
  {
    kind: "tool-result",
    json: {
      matches: [
        { tech: { id: "T-01", display_name: "Tech A.M." }, free_minutes_in_window: 180 },
        { tech: { id: "T-02", display_name: "Tech B.K." }, free_minutes_in_window: 180 },
        { tech: { id: "T-08", display_name: "Tech H.L." }, free_minutes_in_window: 180 },
        { tech: { id: "T-05", display_name: "Tech E.N." }, free_minutes_in_window: 120 },
      ],
    },
  },
  {
    kind: "assistant",
    text:
      "I have 4 available HVAC techs. J-2001 requires 120 minutes; Tech E.N. has exactly 120 free while the others have 180. I'll assign Tech A.M. (T-01) for headroom.",
  },
  {
    kind: "tool-call",
    name: "assign_job",
    args: { job_id: "J-2001", tech_id: "T-01", scheduled_at: "2026-05-09T13:00:00Z" },
  },
  {
    kind: "tool-result",
    json: {
      job: {
        id: "J-2001",
        status: "scheduled",
        assigned_tech_id: "T-01",
        scheduled_at: "2026-05-09T13:00:00Z",
      },
    },
  },
  {
    kind: "tool-call",
    name: "draft_customer_message",
    args: { job_id: "J-2001", intent: "confirmation" },
  },
  {
    kind: "tool-result",
    json: {
      channel: "email",
      subject: "Confirmed: visit on Sat, 09 May 2026 13:00:00 GMT",
      body:
        'Hi Maple Ridge Apartments — confirming Tech A.M. for "Rooftop AC unit not cooling…"',
    },
  },
  { kind: "tool-call", name: "compute_utilization", args: { window_days: 7 } },
  {
    kind: "tool-result",
    json: {
      rows: "[…per-tech load…]",
      capacity_gap_minutes: 0,
    },
  },
  {
    kind: "assistant",
    text:
      "J-2001 assigned to Tech A.M. at 13:00 UTC. 7-day utilization: all techs at 0%, no capacity gap. Two urgent jobs (J-2004 HVAC, J-2002 electrical) remain unscheduled — want me to assign those too?",
  },
];
