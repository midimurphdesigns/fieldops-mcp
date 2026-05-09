import { listOpenJobs } from "./list-open-jobs.ts";
import { findAvailableTechs } from "./find-available-techs.ts";
import { assignJob } from "./assign-job.ts";
import { draftCustomerMessage } from "./draft-customer-message.ts";
import { computeUtilization } from "./compute-utilization.ts";
import { flagForHuman } from "./flag-for-human.ts";

export const tools = {
  list_open_jobs: listOpenJobs,
  find_available_techs: findAvailableTechs,
  assign_job: assignJob,
  draft_customer_message: draftCustomerMessage,
  compute_utilization: computeUtilization,
  flag_for_human: flagForHuman,
} as const;

export type ToolName = keyof typeof tools;
