import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { findAvailableTechs } from "../src/tools/find-available-techs.ts";

test("find_available_techs returns only techs with the requested skill", () => {
  const store = new Store();
  const { matches } = findAvailableTechs.handler(
    {
      skill: "solar",
      window_start: "2026-05-12T08:00:00Z",
      window_end: "2026-05-12T12:00:00Z",
    },
    { store },
  );
  expect(matches.length).toBeGreaterThan(0);
  expect(matches.every((m) => m.tech.skills.includes("solar"))).toBe(true);
});

test("find_available_techs returns empty when window is outside every shift", () => {
  const store = new Store();
  const { matches } = findAvailableTechs.handler(
    {
      skill: "hvac",
      window_start: "2026-05-12T22:00:00Z",
      window_end: "2026-05-12T23:30:00Z",
    },
    { store },
  );
  expect(matches).toEqual([]);
});

test("find_available_techs handles malformed window gracefully", () => {
  const store = new Store();
  const { matches } = findAvailableTechs.handler(
    { skill: "hvac", window_start: "not-a-date", window_end: "also-not-a-date" },
    { store },
  );
  expect(matches).toEqual([]);
});
