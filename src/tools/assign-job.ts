import { z } from "zod";
import type { Job } from "../types.ts";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  job_id: z.string(),
  tech_id: z.string(),
  scheduled_at: z
    .string()
    .describe("ISO-8601 timestamp; must fall within the tech's shift window."),
});

export const assignJob: ToolDef<typeof inputSchema, { job: Job }> = {
  name: "assign_job",
  description:
    "Book a tech for a job at a specific time. Rejects if the tech lacks the required skill, is already booked in the window, or the time falls outside their shift. Mutating; idempotent only when called with identical arguments on an unchanged job.",
  inputSchema,
  handler: (input, { store }) => {
    const job = store.assignJob(input.job_id, input.tech_id, input.scheduled_at);
    return { job };
  },
};
