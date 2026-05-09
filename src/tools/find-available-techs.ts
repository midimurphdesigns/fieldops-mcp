import { z } from "zod";
import type { Tech } from "../types.ts";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  skill: z.enum(["hvac", "electrical", "plumbing", "solar", "diagnostic"]),
  window_start: z
    .string()
    .describe("ISO-8601 timestamp; the earliest moment the tech could begin."),
  window_end: z
    .string()
    .describe("ISO-8601 timestamp; the latest moment the tech could finish."),
});

type Match = {
  tech: Tech;
  free_minutes_in_window: number;
};

const localHM = (d: Date): number => d.getUTCHours() * 60 + d.getUTCMinutes();
const parseHM = (s: string): number => {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
};

export const findAvailableTechs: ToolDef<typeof inputSchema, { matches: Match[] }> = {
  name: "find_available_techs",
  description:
    "Find techs whose skills cover the requested skill and whose shift overlaps the requested window, accounting for jobs already on their schedule. Returns each match with the free-minutes-in-window count.",
  inputSchema,
  handler: (input, { store }) => {
    const start = new Date(input.window_start);
    const end = new Date(input.window_end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return { matches: [] };
    }
    const winStart = start.getTime();
    const winEnd = end.getTime();

    const matches: Match[] = [];
    for (const tech of store.techs()) {
      if (!tech.skills.includes(input.skill)) continue;

      const shiftStart = parseHM(tech.shift_start_local);
      const shiftEnd = parseHM(tech.shift_end_local);
      const reqStart = localHM(start);
      const reqEnd = localHM(end);
      if (reqEnd <= shiftStart || reqStart >= shiftEnd) continue;

      const techJobs = store
        .jobs()
        .filter((j) => j.assigned_tech_id === tech.id && j.scheduled_at);

      let busyMinutes = 0;
      for (const j of techJobs) {
        if (!j.scheduled_at) continue;
        const jStart = new Date(j.scheduled_at).getTime();
        const jEnd = jStart + j.estimated_duration_minutes * 60_000;
        const overlapStart = Math.max(jStart, winStart);
        const overlapEnd = Math.min(jEnd, winEnd);
        if (overlapEnd > overlapStart) {
          busyMinutes += Math.round((overlapEnd - overlapStart) / 60_000);
        }
      }

      const totalMinutes = Math.round((winEnd - winStart) / 60_000);
      const free = Math.max(0, totalMinutes - busyMinutes);
      if (free > 0) {
        matches.push({ tech, free_minutes_in_window: free });
      }
    }

    matches.sort((a, b) => b.free_minutes_in_window - a.free_minutes_in_window);
    return { matches };
  },
};
