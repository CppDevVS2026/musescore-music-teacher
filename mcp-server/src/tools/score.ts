/**
 * Score manipulation tools — create, read, edit, and export MusicXML files.
 *
 * These tools let an AI assistant build scores from scratch, inspect existing
 * scores, and invoke the MuseScore CLI for rendering / export.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  generateMusicXml,
  parseMusicXml,
  type MeasureSpec,
  type NoteSpec,
  type ScoreSpec,
} from "../lib/musicxml.js";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

const NOTE_TO_MIDI: Record<string, number> = {
  C: 60, "C#": 61, Db: 61, D: 62, "D#": 63, Eb: 63, E: 64, F: 65,
  "F#": 66, Gb: 66, G: 67, "G#": 68, Ab: 68, A: 69, "A#": 70, Bb: 70,
  B: 71,
};

function noteNameToMidi(name: string): number | null {
  const match = name.match(/^([A-Ga-g][#b]?)(\d)?$/);
  if (!match) return null;
  const base = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const octave = match[2] !== undefined ? parseInt(match[2], 10) : 4;
  const baseMidi = NOTE_TO_MIDI[base];
  if (baseMidi === undefined) return null;
  return baseMidi + (octave - 4) * 12;
}

/** Try to find the MuseScore executable. */
function findMuseScore(): string | null {
  const candidates = [
    // Windows
    "C:\\Program Files\\MuseScore 4\\bin\\MuseScore4.exe",
    "C:\\Program Files\\MuseScore 3\\bin\\MuseScore3.exe",
    "C:\\Program Files (x86)\\MuseScore 4\\bin\\MuseScore4.exe",
    process.env.MUSESCORE_PATH,
    // macOS
    "/Applications/MuseScore 4.app/Contents/MacOS/mscore",
    "/Applications/MuseScore 3.app/Contents/MacOS/mscore",
    // Linux
    "/usr/bin/musescore4",
    "/usr/bin/musescore",
    "/usr/local/bin/musescore4",
    "/snap/bin/musescore",
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      continue;
    }
  }
  return null;
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Default output directory
function defaultScoreDir(): string {
  const dir = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    "Documents",
    "MuseScoreMCP",
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ---------------------------------------------------------------------------
//  Register tools
// ---------------------------------------------------------------------------

export function registerScoreTools(server: McpServer): void {
  // 1. Create a score
  server.tool(
    "create_score",
    "Create a new MusicXML score file from a specification. " +
      "Returns the file path. The score can then be opened in MuseScore.",
    {
      title: z.string().default("Untitled").describe("Score title"),
      composer: z.string().default("").describe("Composer name"),
      key_fifths: z
        .number()
        .min(-7)
        .max(7)
        .default(0)
        .describe("Key signature fifths (-7..7, 0=C major)"),
      time_beats: z.number().default(4).describe("Time signature numerator"),
      time_beat_type: z.number().default(4).describe("Time signature denominator"),
      measures: z
        .string()
        .describe(
          "Measures as JSON array of arrays of note specs. Each note: " +
            '{"pitch":"C4","duration":"quarter"} or {"rest":true,"duration":"half"}. ' +
            "Separate measures with outer array. Example: " +
            '[[{"pitch":"C4","duration":"quarter"},{"pitch":"E4","duration":"quarter"},' +
            '{"pitch":"G4","duration":"half"}]]',
        ),
      output_path: z.string().optional().describe("Output file path (default: auto-generated in Documents/MuseScoreMCP/)"),
    },
    async ({ title, composer, key_fifths, time_beats, time_beat_type, measures: measuresJson, output_path }) => {
      let rawMeasures: Array<Array<{ pitch?: string; duration?: string; rest?: boolean; chord?: boolean }>>;
      try {
        rawMeasures = JSON.parse(measuresJson);
      } catch {
        return { content: [{ type: "text" as const, text: "Invalid measures JSON. See tool description for format." }] };
      }

      const measureSpecs: MeasureSpec[] = rawMeasures.map((m) => {
        const notes: NoteSpec[] = m.map((n) => {
          if (n.rest) return { pitch: 0, duration: n.duration ?? "quarter", rest: true };
          const midi = n.pitch ? noteNameToMidi(n.pitch) ?? 60 : 60;
          return {
            pitch: midi,
            duration: n.duration ?? "quarter",
            chord: n.chord ?? false,
          };
        });
        return {
          notes,
          keyFifths: key_fifths,
          timeBeats: time_beats,
          timeBeatType: time_beat_type,
        };
      });

      const spec: ScoreSpec = { title, composer, measures: measureSpecs };
      const xml = generateMusicXml(spec);

      const outPath =
        output_path ?? path.join(defaultScoreDir(), `${title.replace(/[^a-zA-Z0-9]/g, "_")}.musicxml`);
      ensureDir(outPath);
      fs.writeFileSync(outPath, xml, "utf-8");

      return {
        content: [
          {
            type: "text" as const,
            text: `Score created: **${outPath}**\n` +
              `${measureSpecs.length} measure(s), key fifths=${key_fifths}, time=${time_beats}/${time_beat_type}.\n` +
              "Open in MuseScore with the `open_in_musescore` tool or manually.",
          },
        ],
      };
    },
  );

  // 2. Read a score
  server.tool(
    "read_score",
    "Read and parse a MusicXML (.musicxml, .xml) file. Returns the notes, title, and structure.",
    {
      file_path: z.string().describe("Path to the MusicXML file"),
    },
    async ({ file_path }) => {
      if (!fs.existsSync(file_path))
        return { content: [{ type: "text" as const, text: `File not found: ${file_path}` }] };

      const xml = fs.readFileSync(file_path, "utf-8");
      const parsed = parseMusicXml(xml);

      const notesByMeasure = new Map<number, typeof parsed.notes>();
      for (const n of parsed.notes) {
        const arr = notesByMeasure.get(n.measure) ?? [];
        arr.push(n);
        notesByMeasure.set(n.measure, arr);
      }

      const lines = [`**${parsed.title}** (${parsed.notes.length} notes)\n`];
      for (const [measure, notes] of notesByMeasure) {
        const noteDescs = notes.map((n) =>
          n.rest ? `rest(${n.duration})` : `${n.step}${n.alter > 0 ? "#" : n.alter < 0 ? "b" : ""}${n.octave}(${n.duration})${n.chord ? "[chord]" : ""}`,
        );
        lines.push(`  m${measure}: ${noteDescs.join("  ")}`);
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 3. Analyze a score file
  server.tool(
    "analyze_score_file",
    "Read a MusicXML file and run harmonic analysis on it (key detection, Roman numerals).",
    {
      file_path: z.string().describe("Path to the MusicXML file"),
    },
    async ({ file_path }) => {
      if (!fs.existsSync(file_path))
        return { content: [{ type: "text" as const, text: `File not found: ${file_path}` }] };

      // Dynamically import theory engine
      const T = await import("../lib/theory-engine.js");
      const xml = fs.readFileSync(file_path, "utf-8");
      const parsed = parseMusicXml(xml);

      // Group notes into chord events by measure and onset
      const events: Array<{ pitchClasses: number[]; bassPc: number; pitches: number[]; measure: number }> = [];
      let currentEvent: typeof events[0] | null = null;

      for (const n of parsed.notes) {
        if (n.rest) continue;
        if (n.chord && currentEvent) {
          currentEvent.pitchClasses.push(n.pitch % 12);
          currentEvent.pitches.push(n.pitch);
          if (n.pitch < currentEvent.bassPc * 12) currentEvent.bassPc = n.pitch % 12;
        } else {
          currentEvent = {
            pitchClasses: [n.pitch % 12],
            bassPc: n.pitch % 12,
            pitches: [n.pitch],
            measure: n.measure,
          };
          events.push(currentEvent);
        }
      }

      if (events.length === 0)
        return { content: [{ type: "text" as const, text: "No pitched notes found in the score." }] };

      // Detect key
      const histogram = new Array(12).fill(0) as number[];
      for (const ev of events) {
        for (const pc of ev.pitchClasses) histogram[pc]++;
      }
      const key = T.detectKey(histogram);

      const lines = [
        `**${parsed.title}** — ${events.length} chord event(s)`,
        `Detected key: **${T.pcToName(key.tonicPc)} ${key.mode}**\n`,
      ];

      // Roman numeral each event
      for (const ev of events) {
        const chord = T.identifyChord(ev.pitchClasses, ev.bassPc);
        if (!chord) {
          lines.push(`  m${ev.measure}: ? (unidentified)`);
          continue;
        }
        const rn = T.romanNumeral(chord, key);
        const rootName = T.pcToName(chord.rootPc);
        lines.push(`  m${ev.measure}: ${rootName}${chord.symbol} = ${rn.roman}`);
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 4. Export score
  server.tool(
    "export_score",
    "Export a score file using the MuseScore CLI to PDF, MIDI, MP3, WAV, or PNG. " +
      "Requires MuseScore to be installed. Set MUSESCORE_PATH env var if not auto-detected.",
    {
      input_path: z.string().describe("Input score file (.musicxml, .mscz, .mscx)"),
      format: z.enum(["pdf", "midi", "mp3", "wav", "png"]).describe("Export format"),
      output_path: z.string().optional().describe("Output file path (default: same name with new extension)"),
    },
    async ({ input_path, format, output_path }) => {
      const mscore = findMuseScore();
      if (!mscore)
        return {
          content: [
            {
              type: "text" as const,
              text: "MuseScore not found. Install MuseScore 4 or set MUSESCORE_PATH environment variable.",
            },
          ],
        };

      if (!fs.existsSync(input_path))
        return { content: [{ type: "text" as const, text: `Input file not found: ${input_path}` }] };

      const outPath =
        output_path ?? input_path.replace(/\.[^.]+$/, `.${format}`);
      ensureDir(outPath);

      try {
        await execFileAsync(mscore, ["-o", outPath, input_path], { timeout: 60_000 });
        return {
          content: [{ type: "text" as const, text: `Exported to: **${outPath}** (${format})` }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Export failed: ${msg}` }],
        };
      }
    },
  );

  // 5. Open in MuseScore
  server.tool(
    "open_in_musescore",
    "Open a score file in MuseScore. Requires MuseScore to be installed.",
    {
      file_path: z.string().describe("Path to the score file"),
    },
    async ({ file_path }) => {
      const mscore = findMuseScore();
      if (!mscore)
        return {
          content: [
            {
              type: "text" as const,
              text: "MuseScore not found. Install MuseScore 4 or set MUSESCORE_PATH.",
            },
          ],
        };

      if (!fs.existsSync(file_path))
        return { content: [{ type: "text" as const, text: `File not found: ${file_path}` }] };

      // Launch non-blocking
      const { spawn } = await import("node:child_process");
      const child = spawn(mscore, [file_path], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      return {
        content: [{ type: "text" as const, text: `Opening **${file_path}** in MuseScore...` }],
      };
    },
  );

  // 6. List score files
  server.tool(
    "list_scores",
    "List MusicXML and MuseScore files in a directory.",
    {
      directory: z
        .string()
        .optional()
        .describe("Directory to scan (default: Documents/MuseScoreMCP/)"),
    },
    async ({ directory }) => {
      const dir = directory ?? defaultScoreDir();
      if (!fs.existsSync(dir))
        return { content: [{ type: "text" as const, text: `Directory not found: ${dir}` }] };

      const extensions = [".musicxml", ".xml", ".mscz", ".mscx", ".mxl"];
      const files = fs.readdirSync(dir).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return extensions.includes(ext);
      });

      if (files.length === 0)
        return { content: [{ type: "text" as const, text: `No score files found in ${dir}` }] };

      const lines = [`**Score files in ${dir}:**`];
      for (const f of files) {
        const stat = fs.statSync(path.join(dir, f));
        const size = (stat.size / 1024).toFixed(1);
        lines.push(`  - ${f} (${size} KB)`);
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 7. Quick note entry helper
  server.tool(
    "write_notes",
    "Write notes to a new score using a shorthand notation. " +
      "Format: 'C4q E4q G4h | D4q F4q A4h' where letter+octave+duration (w=whole h=half q=quarter e=eighth s=16th). " +
      "Use 'r' for rests: 'rq' = quarter rest. Chords use '+': 'C4q+E4+G4'.",
    {
      notation: z.string().describe("Shorthand notation string"),
      title: z.string().default("Quick Score").describe("Score title"),
      key_fifths: z.number().default(0).describe("Key signature fifths"),
      output_path: z.string().optional().describe("Output file path"),
    },
    async ({ notation, title, key_fifths, output_path }) => {
      const durMap: Record<string, string> = {
        w: "whole", h: "half", q: "quarter", e: "eighth", s: "16th",
      };

      const measureStrs = notation.split("|").map((s) => s.trim()).filter(Boolean);
      const measures: MeasureSpec[] = [];

      for (const mStr of measureStrs) {
        const tokens = mStr.split(/\s+/);
        const notes: NoteSpec[] = [];

        for (const token of tokens) {
          // Check for chord: C4q+E4+G4
          const chordParts = token.split("+");
          for (let ci = 0; ci < chordParts.length; ci++) {
            const part = chordParts[ci];
            const isChord = ci > 0;

            // Rest?
            if (part.startsWith("r")) {
              const dur = durMap[part.slice(1)] ?? "quarter";
              notes.push({ pitch: 0, duration: dur, rest: true });
              continue;
            }

            // Note: e.g. C4q, Bb3h, F#5e
            const noteMatch = part.match(/^([A-Ga-g][#b]?)(\d)?([whqes])?$/);
            if (!noteMatch) continue;
            const noteName = noteMatch[1].charAt(0).toUpperCase() + noteMatch[1].slice(1);
            const oct = noteMatch[2] ? parseInt(noteMatch[2], 10) : 4;
            const dur = noteMatch[3] ? (durMap[noteMatch[3]] ?? "quarter") : "quarter";
            const midi = noteNameToMidi(noteName + oct);
            if (midi === null) continue;
            notes.push({ pitch: midi, duration: dur, chord: isChord });
          }
        }

        measures.push({ notes, keyFifths: key_fifths });
      }

      if (measures.length === 0)
        return { content: [{ type: "text" as const, text: "Could not parse any measures from the notation." }] };

      const spec: ScoreSpec = { title, measures };
      const xml = generateMusicXml(spec);
      const outPath =
        output_path ?? path.join(defaultScoreDir(), `${title.replace(/[^a-zA-Z0-9]/g, "_")}.musicxml`);
      ensureDir(outPath);
      fs.writeFileSync(outPath, xml, "utf-8");

      const totalNotes = measures.reduce((sum, m) => sum + m.notes.length, 0);
      return {
        content: [
          {
            type: "text" as const,
            text: `Score **${title}** written to: **${outPath}**\n` +
              `${measures.length} measure(s), ${totalNotes} note(s).`,
          },
        ],
      };
    },
  );
}
