export type Skill =
  | "hvac"
  | "electrical"
  | "plumbing"
  | "solar"
  | "diagnostic";

export type Priority = "low" | "normal" | "urgent";

export type JobStatus = "open" | "scheduled" | "completed" | "flagged";

export type Job = {
  id: string;
  customer_id: string;
  description: string;
  required_skill: Skill;
  priority: Priority;
  status: JobStatus;
  created_at: string;
  scheduled_at: string | null;
  assigned_tech_id: string | null;
  estimated_duration_minutes: number;
  flag_reason: string | null;
};

export type Tech = {
  id: string;
  display_name: string;
  skills: Skill[];
  shift_start_local: string;
  shift_end_local: string;
  home_region: string;
};

export type Customer = {
  id: string;
  display_name: string;
  region: string;
  preferred_contact: "sms" | "email";
};

export type HistoryEntry = {
  job_id: string;
  tech_id: string;
  customer_id: string;
  completed_at: string;
  outcome: "resolved" | "follow_up_needed" | "no_access";
  notes: string;
};

export type StoreData = {
  jobs: Job[];
  techs: Tech[];
  customers: Customer[];
  history: HistoryEntry[];
};
