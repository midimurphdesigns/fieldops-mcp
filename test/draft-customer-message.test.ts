import { test, expect } from "bun:test";
import { Store } from "../src/store.ts";
import { draftCustomerMessage } from "../src/tools/draft-customer-message.ts";

test("draft_customer_message includes job description and tech name when scheduled", () => {
  const store = new Store();
  const out = draftCustomerMessage.handler(
    { job_id: "J-2008", intent: "confirmation" },
    { store },
  );
  expect(out.body).toContain("Conference-room thermostat");
  expect(out.body).toContain("Tech E.N.");
  expect(out.channel).toBe("email");
  expect(out.subject).toBeTruthy();
});

test("draft_customer_message respects sms preference (no subject)", () => {
  const store = new Store();
  const out = draftCustomerMessage.handler(
    { job_id: "J-2002", intent: "delay" },
    { store },
  );
  expect(out.channel).toBe("sms");
  expect(out.subject).toBeNull();
});

test("draft_customer_message rejects reschedule without new_scheduled_at", () => {
  const store = new Store();
  expect(() =>
    draftCustomerMessage.handler({ job_id: "J-2008", intent: "reschedule" }, { store }),
  ).toThrow();
});
