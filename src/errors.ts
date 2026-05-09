export class NotFoundError extends Error {
  override readonly name = "NotFoundError";
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
  }
}

export class ConflictError extends Error {
  override readonly name = "ConflictError";
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  override readonly name = "ValidationError";
  constructor(message: string) {
    super(message);
  }
}

export type ToolError = {
  error: "not_found" | "conflict" | "validation" | "internal";
  message: string;
};

export function toToolError(err: unknown): ToolError {
  if (err instanceof NotFoundError) {
    return { error: "not_found", message: err.message };
  }
  if (err instanceof ConflictError) {
    return { error: "conflict", message: err.message };
  }
  if (err instanceof ValidationError) {
    return { error: "validation", message: err.message };
  }
  if (err instanceof Error) {
    return { error: "internal", message: err.message };
  }
  return { error: "internal", message: "unknown error" };
}
