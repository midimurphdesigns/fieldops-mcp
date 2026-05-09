import data from "./fixtures/data.json" with { type: "json" };
import type {
  Customer,
  HistoryEntry,
  Job,
  JobStatus,
  Priority,
  StoreData,
  Tech,
} from "./types.ts";
import { ConflictError, NotFoundError } from "./errors.ts";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class Store {
  private state: StoreData;

  constructor(initial?: StoreData) {
    this.state = clone(initial ?? (data as StoreData));
  }

  jobs(filter?: { status?: JobStatus; priority?: Priority }): Job[] {
    return this.state.jobs.filter((j) => {
      if (filter?.status && j.status !== filter.status) return false;
      if (filter?.priority && j.priority !== filter.priority) return false;
      return true;
    });
  }

  job(id: string): Job {
    const j = this.state.jobs.find((x) => x.id === id);
    if (!j) throw new NotFoundError("job", id);
    return j;
  }

  techs(): Tech[] {
    return this.state.techs;
  }

  tech(id: string): Tech {
    const t = this.state.techs.find((x) => x.id === id);
    if (!t) throw new NotFoundError("tech", id);
    return t;
  }

  customer(id: string): Customer {
    const c = this.state.customers.find((x) => x.id === id);
    if (!c) throw new NotFoundError("customer", id);
    return c;
  }

  history(filter?: { tech_id?: string; customer_id?: string }): HistoryEntry[] {
    return this.state.history.filter((h) => {
      if (filter?.tech_id && h.tech_id !== filter.tech_id) return false;
      if (filter?.customer_id && h.customer_id !== filter.customer_id) return false;
      return true;
    });
  }

  /**
   * Books a tech for a job. Rejects on:
   * - tech does not have the required skill
   * - tech already has a job whose [start, end) overlaps the new window
   * - scheduled_at falls outside the tech's local shift window
   */
  assignJob(jobId: string, techId: string, scheduledAt: string): Job {
    const job = this.job(jobId);
    const tech = this.tech(techId);

    if (!tech.skills.includes(job.required_skill)) {
      throw new ConflictError(
        `tech ${techId} lacks required skill '${job.required_skill}'`,
      );
    }

    const start = new Date(scheduledAt);
    if (Number.isNaN(start.getTime())) {
      throw new ConflictError(`invalid scheduled_at: ${scheduledAt}`);
    }
    const end = new Date(start.getTime() + job.estimated_duration_minutes * 60_000);

    const localHM = (d: Date): number => d.getUTCHours() * 60 + d.getUTCMinutes();
    const parseHM = (s: string): number => {
      const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
      return (h ?? 0) * 60 + (m ?? 0);
    };
    const startMin = localHM(start);
    const endMin = localHM(end);
    const shiftStart = parseHM(tech.shift_start_local);
    const shiftEnd = parseHM(tech.shift_end_local);
    if (startMin < shiftStart || endMin > shiftEnd) {
      throw new ConflictError(
        `scheduled window ${tech.shift_start_local}-${tech.shift_end_local} excludes ${scheduledAt}`,
      );
    }

    for (const other of this.state.jobs) {
      if (other.id === jobId) continue;
      if (other.assigned_tech_id !== techId) continue;
      if (!other.scheduled_at) continue;
      const oStart = new Date(other.scheduled_at).getTime();
      const oEnd = oStart + other.estimated_duration_minutes * 60_000;
      if (start.getTime() < oEnd && end.getTime() > oStart) {
        throw new ConflictError(
          `tech ${techId} already booked ${other.scheduled_at} for job ${other.id}`,
        );
      }
    }

    job.assigned_tech_id = techId;
    job.scheduled_at = scheduledAt;
    job.status = "scheduled";
    return job;
  }

  flagJob(jobId: string, reason: string): Job {
    const job = this.job(jobId);
    job.status = "flagged";
    job.flag_reason = reason;
    return job;
  }
}

export const store = new Store();
