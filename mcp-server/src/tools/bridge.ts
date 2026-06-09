/**
 * MuseScore real-time bridge tools.
 *
 * These tools communicate with a companion QML plugin running inside
 * MuseScore over a local HTTP connection (default: localhost:18923).
 * The companion plugin polls for commands and sends back results.
 *
 * If the bridge is not running, these tools gracefully report that
 * MuseScore needs the companion plugin enabled.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
//  Bridge communication
// ---------------------------------------------------------------------------

const DEFAULT_BRIDGE_URL = "http://localhost:18923";

interface BridgeResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

async function bridgeRequest(
  endpoint: string,
  body?: Record<string, unknown>,
  bridgeUrl?: string,
): Promise<BridgeResponse> {
  const url = `${bridgeUrl ?? DEFAULT_BRIDGE_URL}${endpoint}`;
  try {
    const resp = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5_000),
    });
    const json = (await resp.json()) as BridgeResponse;
    return json;
  } catch {
    return {
      ok: false,
      error:
        "Could not connect to MuseScore bridge. Make sure MuseScore is running " +
        "with the MCPBridge companion plugin enabled (see companion-plugin/MCPBridge.qml).",
    };
  }
}

// ---------------------------------------------------------------------------
//  Register tools
// ---------------------------------------------------------------------------

export function registerBridgeTools(server: McpServer): void {
  // 1. Bridge status / ping
  server.tool(
    "musescore_status",
    "Check if MuseScore is running and the MCP bridge companion plugin is active.",
    {
      bridge_url: z.string().optional().describe("Bridge URL (default: http://localhost:18923)"),
    },
    async ({ bridge_url }) => {
      const resp = await bridgeRequest("/status", undefined, bridge_url);
      if (!resp.ok) {
        return { content: [{ type: "text" as const, text: resp.error ?? "Bridge not available." }] };
      }
      const data = resp.data as Record<string, unknown> | undefined;
      return {
        content: [
          {
            type: "text" as const,
            text:
              `MuseScore bridge is **active**.\n` +
              (data?.scoreName ? `Current score: ${data.scoreName}\n` : "") +
              (data?.measures ? `Measures: ${data.measures}\n` : "") +
              (data?.staves ? `Staves: ${data.staves}` : ""),
          },
        ],
      };
    },
  );

  // 2. Play / stop
  server.tool(
    "musescore_playback",
    "Control MuseScore playback: play from the beginning, play from cursor, or stop.",
    {
      action: z.enum(["play", "play_from_cursor", "stop"]).describe("Playback action"),
      bridge_url: z.string().optional(),
    },
    async ({ action, bridge_url }) => {
      const resp = await bridgeRequest("/playback", { action }, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Playback command failed." }] };
      return { content: [{ type: "text" as const, text: `Playback: **${action}**` }] };
    },
  );

  // 3. Navigate to measure
  server.tool(
    "musescore_goto",
    "Navigate to a specific measure number in MuseScore.",
    {
      measure: z.number().min(1).describe("Measure number to navigate to"),
      bridge_url: z.string().optional(),
    },
    async ({ measure, bridge_url }) => {
      const resp = await bridgeRequest("/goto", { measure }, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Navigation failed." }] };
      return { content: [{ type: "text" as const, text: `Navigated to measure **${measure}**.` }] };
    },
  );

  // 4. Get current selection
  server.tool(
    "musescore_get_selection",
    "Get the currently selected notes/elements in MuseScore.",
    {
      bridge_url: z.string().optional(),
    },
    async ({ bridge_url }) => {
      const resp = await bridgeRequest("/selection", undefined, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Could not read selection." }] };

      const data = resp.data as Record<string, unknown> | undefined;
      if (!data || !data.notes)
        return { content: [{ type: "text" as const, text: "No selection or empty selection." }] };

      return {
        content: [
          {
            type: "text" as const,
            text: `**Current selection:**\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    },
  );

  // 5. Get score info
  server.tool(
    "musescore_score_info",
    "Get information about the currently open score in MuseScore.",
    {
      bridge_url: z.string().optional(),
    },
    async ({ bridge_url }) => {
      const resp = await bridgeRequest("/score_info", undefined, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Could not read score info." }] };

      const data = resp.data as Record<string, unknown> | undefined;
      const lines: string[] = ["**Score information:**"];
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          lines.push(`  ${k}: ${String(v)}`);
        }
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 6. Run analysis on current score
  server.tool(
    "musescore_analyze_current",
    "Ask the companion plugin to run a theory analysis on the currently open score. " +
      "The results are returned here AND annotated on the score in MuseScore.",
    {
      analysis_type: z
        .enum([
          "harmony",
          "cadences",
          "voice_leading",
          "non_chord_tones",
          "modulations",
          "form",
        ])
        .describe("Type of analysis to run"),
      bridge_url: z.string().optional(),
    },
    async ({ analysis_type, bridge_url }) => {
      const resp = await bridgeRequest("/analyze", { type: analysis_type }, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Analysis failed." }] };

      const data = resp.data as Record<string, unknown> | undefined;
      return {
        content: [
          {
            type: "text" as const,
            text:
              `**${analysis_type} analysis** applied to the score.\n\n` +
              (data?.summary ? String(data.summary) : "Check MuseScore for annotations."),
          },
        ],
      };
    },
  );

  // 7. Add text annotation
  server.tool(
    "musescore_add_text",
    "Add a text annotation at a specific measure in the currently open score.",
    {
      measure: z.number().min(1).describe("Measure number"),
      text: z.string().describe("Text to add"),
      above: z.boolean().default(true).describe("Place above the staff (true) or below (false)"),
      color: z.string().optional().describe("Color hex code, e.g. '#FF0000'"),
      bridge_url: z.string().optional(),
    },
    async ({ measure, text, above, color, bridge_url }) => {
      const resp = await bridgeRequest(
        "/add_text",
        { measure, text, above, color },
        bridge_url,
      );
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Failed to add text." }] };
      return {
        content: [
          { type: "text" as const, text: `Added "${text}" at measure ${measure}.` },
        ],
      };
    },
  );

  // 8. Color notes
  server.tool(
    "musescore_color_notes",
    "Color noteheads in a measure range for visual highlighting.",
    {
      start_measure: z.number().min(1).describe("Starting measure"),
      end_measure: z.number().min(1).describe("Ending measure (inclusive)"),
      color: z.string().describe("Color hex code, e.g. '#FF0000' for red"),
      bridge_url: z.string().optional(),
    },
    async ({ start_measure, end_measure, color, bridge_url }) => {
      const resp = await bridgeRequest(
        "/color_notes",
        { startMeasure: start_measure, endMeasure: end_measure, color },
        bridge_url,
      );
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Failed to color notes." }] };
      return {
        content: [
          {
            type: "text" as const,
            text: `Colored notes in measures ${start_measure}-${end_measure} with ${color}.`,
          },
        ],
      };
    },
  );

  // 9. Reset annotations
  server.tool(
    "musescore_reset",
    "Remove all MCP-added annotations and reset note colors to default.",
    {
      bridge_url: z.string().optional(),
    },
    async ({ bridge_url }) => {
      const resp = await bridgeRequest("/reset", {}, bridge_url);
      if (!resp.ok)
        return { content: [{ type: "text" as const, text: resp.error ?? "Reset failed." }] };
      return {
        content: [{ type: "text" as const, text: "All annotations cleared, note colors reset." }],
      };
    },
  );
}
