import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { computeUtilization } from "../src/tools/compute-utilization.ts";

test("compute_utilization returns one row per tech", () => {
  const store = new Store();
  const { rows } = computeUtilization.handler({ window_days: 7 }, { store });
  expect(rows.length).toBe(store.techs().length);
  for (const row of rows) {
    expect(row.utilization_pct).toBeGreaterThanOrEqual(0);
    expect(row.shift_minutes).toBeGreaterThan(0);
  }
});

test("compute_utilization surfaces a non-negative capacity gap", () => {
  const store = new Store();
  const { capacity_gap_minutes } = computeUtilization.handler(
    { window_days: 1 },
    { store },
  );
  expect(capacity_gap_minutes).toBeGreaterThanOrEqual(0);
});

test("compute_utilization rejects zero-day window via schema", () => {
  const result = computeUtilization.inputSchema.safeParse({ window_days: 0 });
  expect(result.success).toBe(false);
});
