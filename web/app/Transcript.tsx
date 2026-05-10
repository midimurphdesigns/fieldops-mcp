"use client";

import type { TranscriptStep } from "@/lib/transcripts";

export function Transcript({ steps }: { steps: TranscriptStep[] }) {
  return (
    <ol className="space-y-3 text-xs leading-5">
      {steps.map((step, i) => (
        <li key={i}>
          <Step step={step} />
        </li>
      ))}
    </ol>
  );
}

function Step({ step }: { step: TranscriptStep }) {
  if (step.kind === "user") {
    return (
      <div className="border-l-2 border-[rgb(var(--accent))] pl-3">
        <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
          User
        </div>
        <div className="whitespace-pre-wrap">{step.text}</div>
      </div>
    );
  }

  if (step.kind === "assistant") {
    return (
      <div className="border-l-2 border-white/20 pl-3">
        <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
          Assistant
        </div>
        <div className="whitespace-pre-wrap">{step.text}</div>
      </div>
    );
  }

  if (step.kind === "tool-call") {
    return (
      <div className="border border-[rgb(var(--tool-call))]/30 bg-[rgb(var(--tool-call))]/5 p-3">
        <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--tool-call))] mb-2">
          → tool call · {step.name}
        </div>
        <pre className="overflow-x-auto">{JSON.stringify(step.args, null, 2)}</pre>
      </div>
    );
  }

  if (step.kind === "tool-error") {
    return (
      <div className="border border-[rgb(var(--error))]/40 bg-[rgb(var(--error))]/5 p-3">
        <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--error))] mb-2">
          ← tool error · {step.error}
        </div>
        <div>{step.message}</div>
      </div>
    );
  }

  // tool-result
  return (
    <div className="border border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
        ← tool result
      </div>
      <pre className="overflow-x-auto">{JSON.stringify(step.json, null, 2)}</pre>
    </div>
  );
}
