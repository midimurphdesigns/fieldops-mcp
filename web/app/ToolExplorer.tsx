"use client";

import { useState } from "react";
import { TOOLS, FULL_SESSION } from "@/lib/transcripts";
import { Transcript } from "./Transcript";

type View = string; // tool slug or "__session__"

export function ToolExplorer() {
  const [view, setView] = useState<View>(TOOLS[0]?.slug ?? "__session__");

  const selectedTool = TOOLS.find((t) => t.slug === view) ?? null;
  const isSession = view === "__session__";

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <nav className="space-y-1 text-xs md:max-h-[70vh] md:overflow-y-auto pr-2 md:border-r border-white/5">
          <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-2 px-2">
            Tools
          </div>
          {TOOLS.map((tool) => (
            <button
              key={tool.slug}
              onClick={() => setView(tool.slug)}
              className={`block w-full text-left p-2 ${
                view === tool.slug
                  ? "bg-white/5 border-l-2 border-[rgb(var(--accent))]"
                  : "border-l-2 border-transparent hover:bg-white/5"
              }`}
            >
              <div className="font-mono">{tool.name}</div>
              <div className="text-[10px] text-[rgb(var(--muted))] uppercase tracking-wider mt-1">
                {tool.shape}
              </div>
            </button>
          ))}

          <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mt-6 mb-2 px-2">
            Live session
          </div>
          <button
            onClick={() => setView("__session__")}
            className={`block w-full text-left p-2 ${
              isSession
                ? "bg-white/5 border-l-2 border-[rgb(var(--accent))]"
                : "border-l-2 border-transparent hover:bg-white/5"
            }`}
          >
            <div className="font-mono">Full Claude run</div>
            <div className="text-[10px] text-[rgb(var(--muted))] uppercase tracking-wider mt-1">
              All 6 tools, end to end
            </div>
          </button>
        </nav>

        <div className="text-xs leading-5 min-w-0">
          {selectedTool && (
            <article className="space-y-5">
              <header>
                <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
                  {selectedTool.shape}
                </div>
                <h2 className="font-mono text-lg">{selectedTool.name}</h2>
                <p className="mt-2 text-[rgb(var(--ink))]">{selectedTool.oneLiner}</p>
                <p className="mt-3 text-[rgb(var(--muted))]">{selectedTool.designNote}</p>
              </header>

              <Transcript steps={selectedTool.steps} />
            </article>
          )}

          {isSession && (
            <article className="space-y-5">
              <header>
                <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] mb-1">
                  Live Claude session
                </div>
                <h2 className="text-lg">Triage and assignment, end to end</h2>
                <p className="mt-2 text-[rgb(var(--ink))]">
                  Captured 2026-05-09 with claude-sonnet-4-6. The dispatcher's morning: three
                  urgent jobs, one needs an HVAC tech assigned and a confirmation drafted.
                </p>
                <p className="mt-3 text-[rgb(var(--muted))]">
                  Notice the model choosing Tech A.M. over Tech E.N. for headroom — Tech E.N. had
                  exactly enough minutes for the job, no buffer. That's the kind of judgment call
                  the deterministic smoke script can't make and the tool surface has to support.
                </p>
              </header>

              <Transcript steps={FULL_SESSION} />
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
