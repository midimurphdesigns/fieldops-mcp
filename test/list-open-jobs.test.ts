import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { listOpenJobs } from "../src/tools/list-open-jobs.ts";

test("list_open_jobs returns urgent jobs first", () => {
  const store = new Store();
  const { jobs } = listOpenJobs.handler({}, { store });
  expect(jobs.length).toBeGreaterThan(0);
  const firstUrgent = jobs.findIndex((j) => j.priority === "urgent");
  const firstNormal = jobs.findIndex((j) => j.priority === "normal");
  expect(firstUrgent).toBeLessThan(firstNormal);
});

test("list_open_jobs filters by status", () => {
  const store = new Store();
  const { jobs } = listOpenJobs.handler({ status: "scheduled" }, { store });
  expect(jobs.length).toBeGreaterThan(0);
  expect(jobs.every((j) => j.status === "scheduled")).toBe(true);
});

test("list_open_jobs filter for non-existent priority returns empty list (not error)", () => {
  const store = new Store();
  const { jobs } = listOpenJobs.handler({ status: "completed" }, { store });
  expect(jobs).toEqual([]);
});
