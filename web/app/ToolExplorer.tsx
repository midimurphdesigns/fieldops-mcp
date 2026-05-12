"use client";

import * as React from "react";
import { Wrench } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BreathingDot } from "@/components/ui/breathing-dot";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TOOLS, FULL_SESSION } from "@/lib/transcripts";
import { Transcript } from "./Transcript";
import { cn } from "@/lib/utils";

const SESSION_KEY = "__session__";

export function ToolExplorer() {
  const [view, setView] = React.useState<string>(TOOLS[0]?.slug ?? SESSION_KEY);
  const isSession = view === SESSION_KEY;
  const selectedTool = TOOLS.find((t) => t.slug === view) ?? null;

  // Mobile: render a horizontal Tabs strip; Desktop: vertical sidebar.
  return (
    <Tabs value={view} onValueChange={setView}>
      {/* Mobile-only horizontal tab strip */}
      <div className="md:hidden mb-4">
        <ScrollArea className="w-full">
          <TabsList className="flex flex-nowrap">
            {TOOLS.map((t) => (
              <TabsTrigger key={t.slug} value={t.slug} className="font-mono">
                {t.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value={SESSION_KEY}>Full session</TabsTrigger>
          </TabsList>
        </ScrollArea>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Desktop-only vertical sidebar */}
        <nav
          className="hidden md:block text-xs"
          aria-label="Tool navigation"
        >
          <ScrollArea className="md:max-h-[70vh] pr-2">
            <Eyebrow className="mb-2 px-2">Tools</Eyebrow>
            <TabsList className="flex flex-col items-stretch gap-1 bg-transparent">
              {TOOLS.map((t) => (
                <TabsTrigger
                  key={t.slug}
                  value={t.slug}
                  className={cn(
                    "relative justify-start text-left h-auto pl-3 pr-2 py-2 normal-case tracking-normal",
                    "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-transparent before:transition-colors",
                    "data-[state=active]:bg-[var(--color-primary)]/[0.06]",
                    "data-[state=active]:before:bg-[var(--color-primary)]",
                    "hover:bg-white/[0.03]",
                  )}
                >
                  <span className="block w-full">
                    <span className="block font-mono text-xs">{t.name}</span>
                    <span className="block text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider mt-1">
                      {t.shape}
                    </span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <Separator className="my-4" />

            <div className="mb-2 px-2 flex items-center gap-1.5">
              <BreathingDot />
              <Eyebrow>Live session</Eyebrow>
            </div>
            <TabsList className="flex flex-col items-stretch gap-1 bg-transparent">
              <TabsTrigger
                value={SESSION_KEY}
                className={cn(
                  "justify-start text-left h-auto px-2 py-2 normal-case tracking-normal",
                  "data-[state=active]:bg-white/5 data-[state=active]:border-[var(--color-primary)]",
                )}
              >
                <span className="block w-full">
                  <span className="block text-xs">Full Claude run</span>
                  <span className="block text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wider mt-1">
                    All 6 tools, end to end
                  </span>
                </span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </nav>

        <div className="text-xs leading-5 min-w-0">
          {TOOLS.map((tool) => (
            <TabsContent key={tool.slug} value={tool.slug} className="space-y-5">
              <header>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Wrench className="size-4 text-[var(--color-primary)]" />
                  <h2 className="font-mono text-lg">{tool.name}</h2>
                  <Badge variant="muted" className="ml-2">
                    {tool.shape}
                  </Badge>
                </div>
                <p className="text-[var(--color-foreground)] leading-6">{tool.oneLiner}</p>
                <p className="mt-3 text-[var(--color-muted-foreground)] leading-5">
                  {tool.designNote}
                </p>
              </header>
              <Transcript steps={tool.steps} />
            </TabsContent>
          ))}

          <TabsContent value={SESSION_KEY} className="space-y-5">
            <header>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
                Live Claude session
              </div>
              <h2 className="text-lg">Triage and assignment, end to end</h2>
              <p className="mt-2 text-[var(--color-foreground)] leading-6">
                Captured 2026-05-09 with claude-sonnet-4-6. The dispatcher&apos;s morning: three
                urgent jobs, one needs an HVAC tech assigned and a confirmation drafted.
              </p>
              <p className="mt-3 text-[var(--color-muted-foreground)] leading-5">
                Notice the model choosing Tech A.M. over Tech E.N. for headroom — Tech E.N. had
                exactly enough minutes for the job, no buffer. That&apos;s the kind of judgment
                call the deterministic smoke script can&apos;t make and the tool surface has to
                support.
              </p>
            </header>
            <Transcript steps={FULL_SESSION} />
          </TabsContent>
        </div>
      </section>
    </Tabs>
  );
}
