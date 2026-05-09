import { z } from "zod";
import type { Job, Priority } from "../types.ts";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  status: z
    .enum(["open", "scheduled", "completed", "flagged"])
    .optional()
    .describe("Filter by job status. Defaults to all statuses."),
  priority: z
    .enum(["low", "normal", "urgent"])
    .optional()
    .describe("Filter by priority. Defaults to all priorities."),
});

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, normal: 1, low: 2 };

export const listOpenJobs: ToolDef<typeof inputSchema, { jobs: Job[] }> = {
  name: "list_open_jobs",
  description:
    "List service jobs in the dispatch queue, optionally filtered by status or priority. Results are sorted urgent → normal → low, then oldest-first within a priority.",
  inputSchema,
  handler: (input, { store }) => {
    const matched = store.jobs({
      status: input.status,
      priority: input.priority,
    });
    const sorted = [...matched].sort((a, b) => {
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return a.created_at.localeCompare(b.created_at);
    });
    return { jobs: sorted };
  },
};
