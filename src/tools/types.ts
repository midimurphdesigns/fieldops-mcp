import type { z } from "zod";
import type { Store } from "../store.ts";

export type ToolDef<S extends z.ZodTypeAny, R> = {
  name: string;
  description: string;
  inputSchema: S;
  handler: (input: z.infer<S>, ctx: { store: Store }) => R;
};
