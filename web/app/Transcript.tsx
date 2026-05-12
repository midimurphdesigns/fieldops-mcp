"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, MessageCircle, ShieldAlert, User } from "lucide-react";

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

/**
 * Cluster turns: a "turn" begins with a user step and includes every
 * subsequent step until the next user step. Visual grammar:
 *
 *   User → Assistant → tool-call → tool-result → (assistant) ...
 *
 * Each cluster gets a 1px trunk on the left so the related steps
 * read as one strand, not 12 equal boxes. Tool calls/results are
 * indented further (pl-8) under the assistant turn that emitted them.
 *
 * Cyan = agent acting on the world (user, tool-call). Bone = world
 * answering (assistant, tool-result). Red = error.
 */
type Cluster = { user?: TranscriptStep; rest: TranscriptStep[] };

function clusterSteps(steps: TranscriptStep[]): Cluster[] {
  const clusters: Cluster[] = [];
  let current: Cluster | null = null;
  for (const step of steps) {
    if (step.kind === "user") {
      if (current) clusters.push(current);
      current = { user: step, rest: [] };
    } else {
      if (!current) current = { rest: [] };
      current.rest.push(step);
    }
  }
  if (current) clusters.push(current);
  return clusters;
}

export function Transcript({ steps }: { steps: TranscriptStep[] }) {
  if (!steps || steps.length === 0) {
    return (
      <Alert>
        <AlertDescription>No steps recorded for this view.</AlertDescription>
      </Alert>
    );
  }
  const clusters = clusterSteps(steps);
  let runningIndex = 0;
  return (
    <ol className="space-y-8 text-xs leading-5">
      {clusters.map((c, ci) => {
        const startIdx = runningIndex + 1;
        runningIndex += (c.user ? 1 : 0) + c.rest.length;
        return (
          <li key={ci}>
            <TurnCluster cluster={c} turnNumber={ci + 1} startIndex={startIdx} />
          </li>
        );
      })}
    </ol>
  );
}

function TurnCluster({
  cluster,
  turnNumber,
  startIndex,
}: {
  cluster: Cluster;
  turnNumber: number;
  startIndex: number;
}) {
  let i = startIndex;
  return (
    <div className="relative pl-5">
      {/* Trunk — 1px vertical line that connects all steps in this turn */}
      <span
        aria-hidden
        className="absolute left-1 top-3 bottom-3 w-px bg-[var(--color-border)]"
      />
      {/* Turn marker (subtle) */}
      <span
        aria-hidden
        className="absolute left-0 top-2 font-mono text-[10px] text-[var(--color-muted-foreground)]/60 tabular-nums"
      >
        {String(turnNumber).padStart(2, "0")}
      </span>

      <div className="space-y-1.5">
        {cluster.user && <Step step={cluster.user} index={i++} />}
        {cluster.rest.map((s) => (
          <Step
            key={i}
            step={s}
            index={i++}
            indent={s.kind === "tool-call" || s.kind === "tool-result" || s.kind === "tool-error"}
          />
        ))}
      </div>
    </div>
  );
}

function Step({
  step,
  index,
  indent = false,
}: {
  step: TranscriptStep;
  index: number;
  indent?: boolean;
}) {
  const indentClass = indent ? "ml-6" : "";

  if (step.kind === "user") {
    return (
      <div className={`border-l-2 border-[var(--color-primary)] pl-3 py-1 ${indentClass}`}>
        <RoleHeader icon={<User className="size-3" />} label="User" tint="primary" />
        <p className="whitespace-pre-wrap leading-5">{step.text}</p>
      </div>
    );
  }

  if (step.kind === "assistant") {
    return (
      <div className={`border-l-2 border-[var(--color-foreground)]/30 pl-3 py-1 ${indentClass}`}>
        <RoleHeader icon={<MessageCircle className="size-3" />} label="Assistant" tint="bone" />
        <p className="whitespace-pre-wrap leading-5">{step.text}</p>
      </div>
    );
  }

  if (step.kind === "tool-call") {
    return (
      <div
        className={`border-l-2 border-[var(--color-primary)]/40 border-dashed pl-3 py-1.5 ${indentClass}`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <ArrowRight className="size-3 text-[var(--color-primary)]" />
          <span className="font-mono text-[11px] text-[var(--color-primary)]">{step.name}</span>
          <span className="type-eyebrow text-[var(--color-muted-foreground)]">request</span>
          <CopyJsonButton value={step.args} label={`Copy ${step.name} args`} />
        </div>
        <JsonBlock value={step.args} />
      </div>
    );
  }

  if (step.kind === "tool-error") {
    return (
      <Alert variant="destructive" className={indentClass}>
        <ShieldAlert className="size-4" />
        <AlertTitle className="flex items-center gap-2">
          <Badge variant="destructive">{step.error}</Badge>
        </AlertTitle>
        <AlertDescription>{step.message}</AlertDescription>
      </Alert>
    );
  }

  return <ToolResultStep step={step} indentClass={indentClass} />;
}

function RoleHeader({
  icon,
  label,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  tint: "primary" | "bone";
}) {
  return (
    <div
      className={`flex items-center gap-2 mb-1 type-eyebrow ${
        tint === "primary" ? "text-[var(--color-primary)]/80" : "text-[var(--color-muted-foreground)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ToolResultStep({
  step,
  indentClass,
}: {
  step: Extract<TranscriptStep, { kind: "tool-result" }>;
  indentClass: string;
}) {
  const json = JSON.stringify(step.json, null, 2);
  const isLong = json.split("\n").length > 20;
  const [open, setOpen] = React.useState(!isLong);

  return (
    <div
      className={`border-l-2 border-[var(--color-border)] pl-3 py-1.5 ${indentClass}`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <ArrowLeft className="size-3 text-[var(--color-muted-foreground)]" />
        <span className="type-eyebrow text-[var(--color-muted-foreground)]">response</span>
        <CopyJsonButton value={step.json} label="Copy result JSON" />
      </div>
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
    </div>
  );
}

function truncate(value: unknown): unknown {
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
      className="ml-auto text-[10px] font-mono uppercase tracking-wider"
    >
      Copy
    </Button>
  );
}
