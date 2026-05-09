import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { flagForHuman } from "../src/tools/flag-for-human.ts";
import { NotFoundError } from "../src/errors.ts";

test("flag_for_human marks the job as flagged with the given reason", () => {
  const store = new Store();
  const { job } = flagForHuman.handler(
    { job_id: "J-2001", reason: "Customer requested specific tech who is on PTO" },
    { store },
  );
  expect(job.status).toBe("flagged");
  expect(job.flag_reason).toContain("PTO");
});

test("flag_for_human rejects unknown job ids", () => {
  const store = new Store();
  expect(() =>
    flagForHuman.handler({ job_id: "J-9999", reason: "any reason long enough" }, { store }),
  ).toThrow(NotFoundError);
});

test("flag_for_human schema rejects too-short reasons", () => {
  const result = flagForHuman.inputSchema.safeParse({ job_id: "J-2001", reason: "no" });
  expect(result.success).toBe(false);
});
