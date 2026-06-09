#!/usr/bin/env node
/**
 * Local HTTP bridge server that sits between the MCP server and MuseScore.
 *
 * Architecture:
 *   MCP server  --(HTTP)--> bridge-server (this) <--(HTTP polling)-- QML plugin
 *
 * The bridge-server holds a queue of pending commands from the MCP server.
 * The QML plugin polls /poll to get the next command, executes it in MuseScore,
 * and POSTs the result back to /result.
 *
 * The MCP server calls endpoints like /status, /playback, /goto, etc.  The
 * bridge converts these into queued commands and waits for the QML plugin to
 * respond.
 *
 * Usage:
 *   node bridge-server.js [--port 18923]
 *
 * This runs standalone — no build step required.
 */

const http = require("http");
const url = require("url");

const PORT = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--port") || "18923", 10);

// Pending command queue
let pendingCommand = null;
let pendingResolve = null;
let commandId = 0;

function enqueueCommand(endpoint, body) {
  return new Promise((resolve) => {
    commandId++;
    pendingCommand = { id: commandId, endpoint, body };
    pendingResolve = resolve;
    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingResolve === resolve) {
        pendingResolve = null;
        pendingCommand = null;
        resolve({ ok: false, error: "Timeout — MuseScore plugin did not respond in 10s." });
      }
    }, 10000);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  // CORS headers for QML XMLHttpRequest
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // -- QML plugin endpoints --

  // QML plugin polls for commands
  if (path === "/poll" && req.method === "GET") {
    if (pendingCommand) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(pendingCommand));
    } else {
      res.writeHead(204); // No content — no pending command
      res.end();
    }
    return;
  }

  // QML plugin posts results
  if (path === "/result" && req.method === "POST") {
    const body = await readBody(req);
    try {
      const result = JSON.parse(body);
      if (pendingResolve) {
        pendingResolve(result);
        pendingResolve = null;
        pendingCommand = null;
      }
    } catch (e) {
      console.error("Bad result from plugin:", e.message);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  // -- MCP server endpoints --
  // All other paths are commands from the MCP server

  if (req.method === "GET") {
    const result = await enqueueCommand(path, null);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    let parsed = {};
    try { parsed = JSON.parse(body); } catch {}
    const result = await enqueueCommand(path, parsed);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`MCP Bridge server listening on http://localhost:${PORT}`);
  console.log("Waiting for MuseScore plugin to connect...");
});
