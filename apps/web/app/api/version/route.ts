import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    buildDate: new Date().toISOString(),
    changelog: [
      {
        version: "1.0.0",
        date: new Date().toISOString(),
        changes: [
          "Initial release of Orbit CLI",
          "TUI interface for AI-powered development",
          "Multi-language support (JavaScript/TypeScript, Python)",
          "Plugin system for extensibility",
          "Session management",
          "Web interface integration",
        ],
      },
    ],
  });
}
