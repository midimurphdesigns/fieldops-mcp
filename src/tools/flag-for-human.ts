import { z } from "zod";
import type { Job } from "../types.ts";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  job_id: z.string(),
  reason: z
    .string()
    .min(10)
    .describe("Why the agent is escalating instead of acting. Surfaced in the dispatcher's review queue."),
});

export const flagForHuman: ToolDef<typeof inputSchema, { job: Job }> = {
  name: "flag_for_human",
  description:
    "Mark a job for dispatcher review when the agent should not act on its own — ambiguous customer intent, missing data, conflicting constraints, or anything outside the agent's confidence. Use this rather than guessing; refusal is a feature.",
  inputSchema,
  handler: (input, { store }) => {
    const job = store.flagJob(input.job_id, input.reason);
    return { job };
  },
};
