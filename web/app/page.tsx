import { ExternalLink, Github, Info } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CopyableCode } from "@/components/copyable-code";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToolExplorer } from "./ToolExplorer";

const CLONE_SNIPPET = `git clone https://github.com/midimurphdesigns/fieldops-mcp.git
cd fieldops-mcp
bun install
bun run smoke              # deterministic smoke run, no API key
ANTHROPIC_API_KEY=… bun run smoke   # live Claude session`;

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "fieldops": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/fieldops-mcp/src/server.ts"]
    }
  }
}`;

export default function Page() {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:p-2 focus:bg-[var(--color-popover)] focus:border focus:border-[var(--color-primary)] focus:text-xs"
      >
        Skip to content
      </a>
      <main id="content" className="min-h-screen px-4 py-12 sm:px-6 max-w-5xl mx-auto">
        <header className="mb-10 max-w-2xl">
          <h1 className="type-display text-5xl mb-3">fieldops-mcp</h1>
          <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
            A Model Context Protocol server that exposes a small-business field-services
            dispatcher workflow as six agent tools. This page is a tour of real captured exchanges
            — what Claude actually sees and writes back when these tools are exposed.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
            <a
              href="https://github.com/midimurphdesigns/fieldops-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
            >
              <Github className="size-3.5" />
              github.com/midimurphdesigns/fieldops-mcp
            </a>
            <a
              href="https://kevinmurphywebdev.com/blog/building-fieldops-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Read the blog post
            </a>
          </div>
          <Collapsible className="mt-6">
            <CollapsibleTrigger className="group inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              <Info aria-hidden className="size-3" />
              Why this is a showcase, not a live demo
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Alert>
                <AlertDescription className="space-y-2 leading-5">
                  <p>
                    MCP servers don&apos;t have a UI of their own — they speak the MCP protocol
                    over stdio to an LLM host (Claude Desktop, Cursor, Claude Code CLI). The
                    &quot;magic&quot; only happens inside that host, where the model can use the
                    tools.
                  </p>
                  <p>
                    Every transcript here is real output, captured by <code>bun run smoke</code>
                    {" "}(deterministic) or from a live Claude session (regenerable with{" "}
                    <code>ANTHROPIC_API_KEY=… bun run smoke</code>). Nothing on this page is
                    fabricated. To run it yourself, follow the install instructions in the repo
                    and add it to Claude Desktop&apos;s MCP config.
                  </p>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          </Collapsible>
        </header>

        <ToolExplorer />

        <section className="mt-16 border-t border-[var(--color-border)] pt-10 max-w-3xl">
          <Eyebrow className="mb-3">Run it yourself</Eyebrow>
          <h2 className="text-2xl tracking-tight mb-3">Two minutes from clone to Claude Desktop</h2>
          <p className="text-sm leading-6 text-[var(--color-muted-foreground)] mb-6">
            The showcase replays captured exchanges. To run the actual MCP server inside Claude
            Desktop and drive it with your own prompts, clone the repo and wire it up.
          </p>

          <Eyebrow className="mb-2">01 — Clone &amp; smoke</Eyebrow>
          <CopyableCode code={CLONE_SNIPPET} />

          <p className="mt-6 mb-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            <span className="type-eyebrow inline-block mr-2 align-middle">02 — Register</span>
            Add an entry to{" "}
            <code className="font-mono text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>:
          </p>
          <CopyableCode code={CLAUDE_DESKTOP_CONFIG} />

          <p className="mt-6 text-sm leading-6 text-[var(--color-muted-foreground)]">
            <span className="type-eyebrow inline-block mr-2 align-middle">03 — Restart</span>
            Claude Desktop reloads and the six tools appear in the tool picker. Now your prompts
            drive them, not mine.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] max-w-2xl">
          Six tools, six structurally distinct shapes. The interesting design work is choosing
          what to expose — the absences are as much the design as the presences. See{" "}
          <a
            className="underline"
            href="https://github.com/midimurphdesigns/fieldops-mcp/blob/main/docs/TOOL_DESIGN.md"
          >
            TOOL_DESIGN.md
          </a>{" "}
          for the longer essay.
        </footer>

        <Toaster position="top-right" />
      </main>
    </>
  );
}
