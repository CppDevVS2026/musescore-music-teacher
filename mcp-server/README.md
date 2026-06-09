# MuseScore MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that
gives AI assistants the ability to **teach music theory** and **control
MuseScore**.  Built for use with Devin, Antigravity, Claude Desktop, or any
MCP-compatible client.

## What can it do?

### Music Theory Teaching (11 tools)

| Tool | Description |
| --- | --- |
| `identify_chord` | Identify a chord from note names (e.g. "C E G" → C major) |
| `detect_key` | Detect the key from a collection of notes |
| `roman_numeral` | Get Roman numeral + analysis for a chord in a key |
| `analyze_progression` | Full harmonic analysis of a chord progression |
| `explore_scales` | List scales/modes or find scales fitting given notes |
| `identify_interval` | Name the interval between two notes |
| `generate_drill` | Generate theory drill questions (interval, chord, scale, etc.) |
| `explain_concept` | Explain a music theory concept with examples |
| `check_voice_leading` | Check for parallel 5ths/8ves and common mistakes |
| `sight_reading_difficulty` | Score difficulty (1-10) with practice tips |
| `ear_training_hint` | Scale-degree ear-training hints (solfège, character) |

### Score Manipulation (7 tools)

| Tool | Description |
| --- | --- |
| `create_score` | Create a MusicXML score from a JSON specification |
| `read_score` | Parse and display contents of a MusicXML file |
| `analyze_score_file` | Run harmonic analysis on a MusicXML file |
| `export_score` | Export via MuseScore CLI (PDF, MIDI, MP3, WAV, PNG) |
| `open_in_musescore` | Open a score file in MuseScore |
| `list_scores` | List score files in a directory |
| `write_notes` | Quick score creation with shorthand notation |

### MuseScore Real-Time Bridge (9 tools)

| Tool | Description |
| --- | --- |
| `musescore_status` | Check if MuseScore bridge is active |
| `musescore_playback` | Play / stop / play-from-cursor |
| `musescore_goto` | Navigate to a specific measure |
| `musescore_get_selection` | Get currently selected notes |
| `musescore_score_info` | Get info about the open score |
| `musescore_analyze_current` | Run theory analysis and annotate the live score |
| `musescore_add_text` | Add text annotations at a measure |
| `musescore_color_notes` | Color noteheads for visual highlighting |
| `musescore_reset` | Clear all annotations and reset colors |

## Quick Start

```bash
cd mcp-server
npm install
npm run build
```

### Use with Claude Desktop / Devin / Antigravity

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "musescore": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### Use with SSE transport

```bash
node dist/index.js --sse
# → Listening on http://localhost:3100
```

## MuseScore Bridge Setup

The bridge tools require the companion QML plugin running inside MuseScore:

1. **Start the bridge server:**
   ```bash
   node companion-plugin/bridge-server.js
   ```

2. **Install the companion plugin:**
   Copy `companion-plugin/MCPBridge.qml` to your MuseScore plugins directory:
   - **Windows:** `%HOMEPATH%\Documents\MuseScore4\Plugins\`
   - **macOS:** `~/Documents/MuseScore4/Plugins/`
   - **Linux:** `~/Documents/MuseScore4/Plugins/`

3. **Enable the plugin** in MuseScore: Home → Plugins → enable "MCP Bridge".

4. **Click "Start"** in the MCP Bridge plugin panel.

The bridge server sits between the MCP server and MuseScore:

```
AI Assistant ←→ MCP Server ←→ Bridge Server (localhost:18923) ←→ QML Plugin (MuseScore)
```

## Architecture

The theory engine (`theory.js`) is shared with the MuseScore plugins — the
MCP server imports it directly via `require()`, so there is zero
reimplementation and all 3 000+ lines of music theory stay in sync.

```
mcp-server/
  src/
    index.ts              MCP entry point (stdio + SSE)
    tools/
      theory.ts           11 music-theory teaching tools
      score.ts            7 score manipulation tools
      bridge.ts           9 MuseScore bridge tools
    lib/
      theory-engine.ts    Typed wrapper around theory.js
      musicxml.ts         MusicXML generation & parsing
companion-plugin/
  MCPBridge.qml           MuseScore companion plugin
  bridge-server.js        Local HTTP bridge server
```

## Teaching Workflow Example

An AI assistant might use these tools to teach you a lesson:

1. **explain_concept** "cadence" → Explains PAC, IAC, HC, DC, plagal
2. **generate_drill** type=cadence, count=5 → Quiz questions
3. **write_notes** → Creates a score with examples
4. **open_in_musescore** → Opens it for you to see/hear
5. **musescore_playback** → Plays the examples
6. **musescore_add_text** → Annotates the score with labels
7. **analyze_progression** → Explains what's happening harmonically

## Environment Variables

| Variable | Description |
| --- | --- |
| `MUSESCORE_PATH` | Path to MuseScore executable (auto-detected if not set) |
| `PORT` | SSE server port (default: 3100) |

## License

MIT — same as the parent project.
