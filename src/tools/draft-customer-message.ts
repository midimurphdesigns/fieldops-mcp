import { z } from "zod";
import type { ToolDef } from "./types.ts";

const inputSchema = z.object({
  job_id: z.string(),
  intent: z.enum(["confirmation", "delay", "reschedule"]),
  new_scheduled_at: z
    .string()
    .optional()
    .describe("Required when intent='reschedule'. ISO-8601 timestamp of the proposed new slot."),
});

export const draftCustomerMessage: ToolDef<
  typeof inputSchema,
  { channel: "sms" | "email"; subject: string | null; body: string }
> = {
  name: "draft_customer_message",
  description:
    "Compose a customer-ready message for a job in one of three intents: confirmation, delay, or reschedule. Returns text only; does not send. Pulls customer, tech, and job context from the store. Use this rather than free-form generation so the message stays grounded in real fixture data.",
  inputSchema,
  handler: (input, { store }) => {
    const job = store.job(input.job_id);
    const customer = store.customer(job.customer_id);
    const tech = job.assigned_tech_id ? store.tech(job.assigned_tech_id) : null;
    const channel = customer.preferred_contact;

    if (input.intent === "reschedule" && !input.new_scheduled_at) {
      throw new Error("new_scheduled_at is required when intent='reschedule'");
    }

    const when = input.intent === "reschedule" ? input.new_scheduled_at : job.scheduled_at;
    const formattedWhen = when ? new Date(when).toUTCString() : "TBD";
    const techLine = tech ? tech.display_name : "an available technician";

    let subject: string | null = null;
    let body = "";

    switch (input.intent) {
      case "confirmation":
        subject = channel === "email" ? `Confirmed: visit on ${formattedWhen}` : null;
        body = `Hi ${customer.display_name} — confirming ${techLine} for "${job.description}" on ${formattedWhen}. Reply if anything changes on your end.`;
        break;
      case "delay":
        subject = channel === "email" ? `Update on your service request` : null;
        body = `Hi ${customer.display_name} — we're running behind on "${job.description}" and wanted to let you know before your slot. We'll confirm a firm window shortly.`;
        break;
      case "reschedule":
        subject = channel === "email" ? `Reschedule request: ${formattedWhen}` : null;
        body = `Hi ${customer.display_name} — we'd like to move "${job.description}" to ${formattedWhen} with ${techLine}. Reply yes to confirm or suggest another time.`;
        break;
    }

    return { channel, subject, body };
  },
};
