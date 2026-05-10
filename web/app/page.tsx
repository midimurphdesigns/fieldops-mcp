import { ToolExplorer } from "./ToolExplorer";

export default function Page() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">fieldops-mcp</h1>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          A Model Context Protocol server that exposes a small-business field-services dispatcher
          workflow as six agent tools. This page is a tour of real captured exchanges — what
          Claude actually sees and writes back when these tools are exposed.
        </p>
        <p className="text-xs mt-3 text-[rgb(var(--muted))]">
          Source:{" "}
          <a className="underline" href="https://github.com/midimurphdesigns/fieldops-mcp">
            github.com/midimurphdesigns/fieldops-mcp
          </a>
        </p>
        <details className="mt-6 text-xs text-[rgb(var(--muted))]">
          <summary className="cursor-pointer hover:text-[rgb(var(--ink))]">
            Why this is a showcase, not a live demo
          </summary>
          <div className="mt-3 leading-6 max-w-prose space-y-2">
            <p>
              MCP servers don't have a UI of their own — they speak the MCP protocol over stdio
              to an LLM host (Claude Desktop, Cursor, Claude Code CLI). The "magic" only happens
              inside that host, where the model can use the tools.
            </p>
            <p>
              Every transcript here is real output, captured by{" "}
              <code>bun run smoke</code> (deterministic) or from a live Claude session
              (regenerable with <code>ANTHROPIC_API_KEY=… bun run smoke</code>). Nothing on this
              page is fabricated. To run it yourself, follow the install instructions in the repo
              and add it to Claude Desktop's MCP config.
            </p>
          </div>
        </details>
      </header>

      <ToolExplorer />

      <footer className="mt-16 pt-8 border-t border-white/10 text-xs text-[rgb(var(--muted))] max-w-2xl">
        Six tools, six structurally distinct shapes. The interesting design work is choosing what
        to expose — the absences are as much the design as the presences. See{" "}
        <a className="underline" href="https://github.com/midimurphdesigns/fieldops-mcp/blob/main/docs/TOOL_DESIGN.md">
          TOOL_DESIGN.md
        </a>{" "}
        for the longer essay.
      </footer>
    </main>
  );
}
