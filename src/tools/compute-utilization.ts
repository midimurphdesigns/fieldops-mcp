import { z } from "zod";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  window_days: z
    .number()
    .int()
    .min(1)
    .max(30)
    .describe("Forward-looking window in days from now over which to compute load."),
});

type Row = {
  tech_id: string;
  display_name: string;
  scheduled_minutes: number;
  shift_minutes: number;
  utilization_pct: number;
  open_skill_demand: number;
};

const parseHM = (s: string): number => {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
};

export const computeUtilization: ToolDef<
  typeof inputSchema,
  { rows: Row[]; capacity_gap_minutes: number }
> = {
  name: "compute_utilization",
  description:
    "Compute per-tech utilization (% of shift minutes already scheduled) over a forward window, plus a capacity-gap estimate (open-job minutes that no scheduled tech can absorb). Read-only; safe to call repeatedly.",
  inputSchema,
  handler: (input, { store }) => {
    const now = Date.now();
    const horizon = now + input.window_days * 24 * 60 * 60_000;
    const techs = store.techs();
    const allJobs = store.jobs();

    const rows: Row[] = techs.map((tech) => {
      const shiftMinPerDay = parseHM(tech.shift_end_local) - parseHM(tech.shift_start_local);
      const shiftMinutes = shiftMinPerDay * input.window_days;

      let scheduled = 0;
      for (const j of allJobs) {
        if (j.assigned_tech_id !== tech.id) continue;
        if (!j.scheduled_at) continue;
        const t = new Date(j.scheduled_at).getTime();
        if (t >= now && t <= horizon) {
          scheduled += j.estimated_duration_minutes;
        }
      }

      const openSkillDemand = allJobs
        .filter((j) => j.status === "open" && tech.skills.includes(j.required_skill))
        .reduce((sum, j) => sum + j.estimated_duration_minutes, 0);

      return {
        tech_id: tech.id,
        display_name: tech.display_name,
        scheduled_minutes: scheduled,
        shift_minutes: shiftMinutes,
        utilization_pct:
          shiftMinutes > 0 ? Math.round((scheduled / shiftMinutes) * 1000) / 10 : 0,
        open_skill_demand: openSkillDemand,
      };
    });

    const totalFreeCapacity = rows.reduce(
      (sum, r) => sum + Math.max(0, r.shift_minutes - r.scheduled_minutes),
      0,
    );
    const totalOpenDemand = allJobs
      .filter((j) => j.status === "open")
      .reduce((sum, j) => sum + j.estimated_duration_minutes, 0);
    const capacity_gap_minutes = Math.max(0, totalOpenDemand - totalFreeCapacity);

    return { rows, capacity_gap_minutes };
  },
};
