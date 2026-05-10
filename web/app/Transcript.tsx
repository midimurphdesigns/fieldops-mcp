"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, MessageCircle, ShieldAlert, User } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { JsonBlock } from "@/components/json-block";
import { toast } from "sonner";
import type { TranscriptStep } from "@/lib/transcripts";

export function Transcript({ steps }: { steps: TranscriptStep[] }) {
  if (!steps || steps.length === 0) {
    return (
      <Alert>
        <AlertDescription>No steps recorded for this view.</AlertDescription>
      </Alert>
    );
  }
  return (
    <ol className="space-y-3 text-xs leading-5">
      {steps.map((step, i) => (
        <li key={i}>
          <Step step={step} index={i + 1} />
        </li>
      ))}
    </ol>
  );
}

function Step({ step, index }: { step: TranscriptStep; index: number }) {
  if (step.kind === "user") {
    return (
      <div className="border-l-2 border-[var(--color-primary)] pl-3 py-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
          <User className="size-3" />
          <span>User</span>
          <StepIndex index={index} />
        </div>
        <p className="whitespace-pre-wrap leading-5">{step.text}</p>
      </div>
    );
  }

  if (step.kind === "assistant") {
    return (
      <div className="border-l-2 border-white/20 pl-3 py-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
          <MessageCircle className="size-3" />
          <span>Assistant</span>
          <StepIndex index={index} />
        </div>
        <p className="whitespace-pre-wrap leading-5">{step.text}</p>
      </div>
    );
  }

  if (step.kind === "tool-call") {
    return (
      <Card className="border-yellow-400/30 bg-yellow-400/[0.02]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-3.5 text-yellow-300" />
            <span className="font-mono text-xs text-yellow-200">{step.name}</span>
            <Badge variant="warning">tool call</Badge>
            <span className="ml-auto"><StepIndex index={index} /></span>
            <CopyJsonButton value={step.args} label={`Copy ${step.name} args`} />
          </div>
        </CardHeader>
        <CardContent>
          <JsonBlock value={step.args} />
        </CardContent>
      </Card>
    );
  }

  if (step.kind === "tool-error") {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle className="flex items-center gap-2">
          <Badge variant="destructive">{step.error}</Badge>
          <span className="ml-auto"><StepIndex index={index} /></span>
        </AlertTitle>
        <AlertDescription>{step.message}</AlertDescription>
      </Alert>
    );
  }

  // tool-result
  return <ToolResultStep step={step} index={index} />;
}

function ToolResultStep({
  step,
  index,
}: {
  step: Extract<TranscriptStep, { kind: "tool-result" }>;
  index: number;
}) {
  const json = JSON.stringify(step.json, null, 2);
  const isLong = json.split("\n").length > 20;
  const [open, setOpen] = React.useState(!isLong);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowLeft className="size-3.5 text-[var(--color-muted-foreground)]" />
          <Badge variant="muted">tool result</Badge>
          <span className="ml-auto"><StepIndex index={index} /></span>
          <CopyJsonButton value={step.json} label="Copy result JSON" />
        </div>
      </CardHeader>
      <CardContent>
        {isLong && !open ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <JsonBlock value={truncate(step.json)} maxHeight="20rem" />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2">
                Show full ({json.split("\n").length} lines)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent />
          </Collapsible>
        ) : (
          <div>
            <JsonBlock value={step.json} maxHeight="32rem" />
            {isLong && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>
                Collapse
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function truncate(value: unknown): unknown {
  // Show only the first 10 keys / array entries.
  if (Array.isArray(value)) return value.slice(0, 10);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    let i = 0;
    for (const [k, v] of Object.entries(value)) {
      if (i++ >= 10) {
        out["…"] = "…";
        break;
      }
      out[k] = v;
    }
    return out;
  }
  return value;
}

function StepIndex({ index }: { index: number }) {
  return (
    <span className="font-mono text-[10px] text-[var(--color-muted-foreground)] tabular-nums">
      #{index}
    </span>
  );
}

function CopyJsonButton({ value, label }: { value: unknown; label: string }) {
  function copy() {
    navigator.clipboard
      .writeText(JSON.stringify(value, null, 2))
      .then(() => toast.success("Copied JSON"))
      .catch(() => toast.error("Couldn't copy"));
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={copy}
      aria-label={label}
      className="text-[10px] font-mono uppercase tracking-wider"
    >
      Copy
    </Button>
  );
}
