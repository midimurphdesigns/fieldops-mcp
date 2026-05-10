import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://fieldops-mcp.kevinmurphywebdev.com";
const TITLE = "fieldops-mcp — agent tool design showcase";
const DESCRIPTION =
  "Interactive tour of real captured Claude Desktop transcripts of fieldops-mcp's six MCP tools. Read, search, mutation with typed errors, composition, aggregation, and human escalation.";

/* Reuse the main portfolio's /og route so every property in the trilogy
 * shares one canvas. Per-property query string distinguishes them. */
const OG_IMAGE = `https://kevinmurphywebdev.com/og?title=${encodeURIComponent(
  "fieldops-mcp",
)}&subtitle=${encodeURIComponent(
  "An MCP server exposing a small-business field-services workflow as six agent tools an LLM can drive end-to-end.",
)}&eyebrow=${encodeURIComponent("DEMO — FIELDOPS-MCP")}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Kevin Murphy",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: "@midimurphdesigns",
    site: "@midimurphdesigns",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
