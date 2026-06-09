#!/usr/bin/env node
/**
 * MuseScore MCP Server
 *
 * An MCP server that gives AI assistants (Devin, Antigravity, Claude, etc.)
 * the ability to:
 *
 *   1. Teach music theory — chord ID, key detection, Roman numerals, drills,
 *      voice leading, cadences, scales, concepts, ear training.
 *
 *   2. Create & read scores — MusicXML generation/parsing, shorthand entry,
 *      harmonic analysis of score files.
 *
 *   3. Control MuseScore — real-time bridge to the running application via
 *      a companion QML plugin for playback, navigation, annotation.
 *
 * Usage:
 *   npx musescore-mcp          # stdio transport (for MCP clients)
 *   npx musescore-mcp --sse    # SSE transport on port 3100
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTheoryTools } from "./tools/theory.js";
import { registerScoreTools } from "./tools/score.js";
import { registerBridgeTools } from "./tools/bridge.js";

const server = new McpServer({
  name: "musescore-mcp",
  version: "1.0.0",
});

// Register all tool groups
registerTheoryTools(server);
registerScoreTools(server);
registerBridgeTools(server);

// --- Transport selection ---------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--sse")) {
    // SSE transport for web-based clients
    const { SSEServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/sse.js"
    );
    const http = await import("node:http");
    const port = parseInt(process.env.PORT ?? "3100", 10);

    let sseTransport: InstanceType<typeof SSEServerTransport> | null = null;

    const httpServer = http.createServer(async (req, res) => {
      if (req.url === "/sse" || req.url === "/") {
        sseTransport = new SSEServerTransport("/message", res);
        await server.connect(sseTransport);
      } else if (req.url === "/message" && req.method === "POST") {
        if (sseTransport) {
          await sseTransport.handlePostMessage(req, res);
        } else {
          res.writeHead(400);
          res.end("No active SSE connection");
        }
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    httpServer.listen(port, () => {
      console.error(`MuseScore MCP server (SSE) listening on http://localhost:${port}`);
    });
  } else {
    // Default: stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MuseScore MCP server running on stdio");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
