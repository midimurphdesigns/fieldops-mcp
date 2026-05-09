import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { assignJob } from "../src/tools/assign-job.ts";
import { ConflictError, NotFoundError } from "../src/errors.ts";

test("assign_job books a tech and updates job state", () => {
  const store = new Store();
  const { job } = assignJob.handler(
    { job_id: "J-2003", tech_id: "T-01", scheduled_at: "2026-05-12T13:00:00Z" },
    { store },
  );
  expect(job.assigned_tech_id).toBe("T-01");
  expect(job.scheduled_at).toBe("2026-05-12T13:00:00Z");
  expect(job.status).toBe("scheduled");
});

test("assign_job rejects a tech without the required skill", () => {
  const store = new Store();
  expect(() =>
    assignJob.handler(
      { job_id: "J-2010", tech_id: "T-04", scheduled_at: "2026-05-12T13:00:00Z" },
      { store },
    ),
  ).toThrow(ConflictError);
});

test("assign_job rejects a time outside the tech's shift", () => {
  const store = new Store();
  expect(() =>
    assignJob.handler(
      { job_id: "J-2003", tech_id: "T-01", scheduled_at: "2026-05-12T22:00:00Z" },
      { store },
    ),
  ).toThrow(ConflictError);
});

test("assign_job rejects an unknown job id", () => {
  const store = new Store();
  expect(() =>
    assignJob.handler(
      { job_id: "J-9999", tech_id: "T-01", scheduled_at: "2026-05-12T13:00:00Z" },
      { store },
    ),
  ).toThrow(NotFoundError);
});

test("assign_job rejects a conflicting time slot for the same tech", () => {
  const store = new Store();
  assignJob.handler(
    { job_id: "J-2003", tech_id: "T-01", scheduled_at: "2026-05-12T13:00:00Z" },
    { store },
  );
  expect(() =>
    assignJob.handler(
      { job_id: "J-2004", tech_id: "T-01", scheduled_at: "2026-05-12T13:30:00Z" },
      { store },
    ),
  ).toThrow(ConflictError);
});
