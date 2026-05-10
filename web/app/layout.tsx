import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fieldops-mcp — agent tool design showcase",
  description:
    "Interactive tour of real captured Claude Desktop transcripts of fieldops-mcp's six MCP tools. Read, search, mutation with typed errors, composition, aggregation, and human escalation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
