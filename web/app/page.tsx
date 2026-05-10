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

      <section className="mt-16 pt-8 border-t border-white/10 max-w-3xl">
        <h2 className="text-base font-semibold mb-3">Run it yourself</h2>
        <p className="text-xs leading-5 text-[rgb(var(--muted))] max-w-prose mb-4">
          The showcase replays captured exchanges. To run the actual MCP server inside Claude
          Desktop and drive it with your own prompts, clone the repo and wire it up — ~2 minutes.
        </p>
        <pre className="text-[11px] leading-5 p-3 border border-white/10 bg-white/[0.02] overflow-x-auto">
{`git clone https://github.com/midimurphdesigns/fieldops-mcp.git
cd fieldops-mcp
bun install
bun run smoke              # deterministic smoke run, no API key
ANTHROPIC_API_KEY=… bun run smoke   # live Claude session`}
        </pre>
        <p className="text-xs leading-5 text-[rgb(var(--muted))] max-w-prose mt-4">
          To register it with Claude Desktop, add an entry to{" "}
          <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:
        </p>
        <pre className="text-[11px] leading-5 p-3 border border-white/10 bg-white/[0.02] overflow-x-auto mt-2">
{`{
  "mcpServers": {
    "fieldops": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/fieldops-mcp/src/server.ts"]
    }
  }
}`}
        </pre>
        <p className="text-xs leading-5 text-[rgb(var(--muted))] max-w-prose mt-4">
          Restart Claude Desktop and the six tools appear in the tool picker. Now your prompts
          drive them, not mine.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-white/10 text-xs text-[rgb(var(--muted))] max-w-2xl">
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
