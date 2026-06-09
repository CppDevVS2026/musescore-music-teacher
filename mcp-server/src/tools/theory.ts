/**
 * Music-theory teaching tools exposed via MCP.
 *
 * Every tool returns a human-readable string (or structured JSON) that an LLM
 * can relay to the student.  Internally they delegate to theory-engine.ts which
 * wraps the canonical theory.js without reimplementation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as T from "../lib/theory-engine.js";

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

const NOTE_NAMES: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4, "E#": 5,
  F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10,
  B: 11, Cb: 11, "B#": 0,
};

function parseNoteName(name: string): number | null {
  const n = name.trim();
  // Try direct lookup
  if (NOTE_NAMES[n] !== undefined) return NOTE_NAMES[n];
  // Try case-insensitive
  const upper = n.charAt(0).toUpperCase() + n.slice(1);
  if (NOTE_NAMES[upper] !== undefined) return NOTE_NAMES[upper];
  // Try as MIDI number
  const num = parseInt(n, 10);
  if (!isNaN(num) && num >= 0 && num < 128) return num % 12;
  return null;
}

function parseNoteList(input: string): number[] {
  return input
    .split(/[\s,;]+/)
    .map(parseNoteName)
    .filter((n): n is number => n !== null);
}

function keyFromString(keyStr: string): T.KeyInfo | null {
  const parts = keyStr.trim().split(/\s+/);
  if (parts.length < 1) return null;
  const pc = parseNoteName(parts[0]);
  if (pc === null) return null;
  const mode = parts[1]?.toLowerCase().startsWith("min") ? "minor" : "major";
  return { tonicPc: pc, mode };
}

function pcName(pc: number, preferFlats = false): string {
  return T.pcToName(T.mod(pc, 12), preferFlats);
}

const INTERVAL_NAMES: Record<number, string> = {
  0: "Unison (P1)",
  1: "Minor 2nd (m2)",
  2: "Major 2nd (M2)",
  3: "Minor 3rd (m3)",
  4: "Major 3rd (M3)",
  5: "Perfect 4th (P4)",
  6: "Tritone (A4/d5)",
  7: "Perfect 5th (P5)",
  8: "Minor 6th (m6)",
  9: "Major 6th (M6)",
  10: "Minor 7th (m7)",
  11: "Major 7th (M7)",
};

const CONCEPT_LIBRARY: Record<string, string> = {
  interval:
    "An interval is the distance between two pitches, measured in half-steps. " +
    "Intervals have a quality (major, minor, perfect, augmented, diminished) and a number (2nd, 3rd, etc.). " +
    "For example, C to E is a Major 3rd (4 half-steps). C to Eb is a Minor 3rd (3 half-steps).",
  chord:
    "A chord is three or more notes sounding together. The most basic chord is a triad (root, 3rd, 5th). " +
    "Major triads have a M3 + m3 (e.g. C-E-G). Minor triads have m3 + M3 (e.g. C-Eb-G). " +
    "Diminished triads: m3 + m3. Augmented triads: M3 + M3.",
  "roman numeral":
    "Roman numerals label chords by their scale degree. Uppercase = major, lowercase = minor. " +
    "In C major: I = C, ii = Dm, iii = Em, IV = F, V = G, vi = Am, vii\u00b0 = Bdim. " +
    "Inversions are shown with figured-bass numbers: I6 = first inversion, V65 = dominant 7th first inversion.",
  cadence:
    "A cadence is a harmonic arrival point. Types: PAC (V-I, soprano on tonic), IAC (V-I, weaker), " +
    "Half cadence (ends on V), Deceptive (V-vi), Plagal (IV-I, 'Amen cadence').",
  "secondary dominant":
    "A secondary dominant (V/x) is a major chord or dominant 7th that resolves to a diatonic chord " +
    "other than the tonic. Example in C major: D major (V/V) resolves to G. A7 (V/ii) resolves to Dm.",
  "voice leading":
    "Voice leading is how individual voices move from chord to chord. Rules: " +
    "avoid parallel 5ths and 8ves, resolve leading tones up, resolve 7ths down, " +
    "prefer contrary motion, keep common tones.",
  "mode mixture":
    "Mode mixture (borrowed chords) uses chords from the parallel key. In C major, you might " +
    "borrow iv (Fm), bVI (Ab), bVII (Bb) from C minor. Creates a darker, richer sound.",
  scale:
    "A scale is an ordered set of pitches. Major scale: W-W-H-W-W-W-H. Natural minor: W-H-W-W-H-W-W. " +
    "Modes: Dorian (m with raised 6), Mixolydian (M with lowered 7), Phrygian (m with lowered 2), etc.",
  "augmented sixth":
    "Augmented sixth chords contain the interval of an augmented 6th, typically resolving to V. " +
    "Three types: Italian (It+6) = b6-1-#4, French (Fr+6) = b6-1-2-#4, German (Ger+6) = b6-1-b3-#4.",
  "neapolitan":
    "The Neapolitan chord (bII or N6) is a major triad built on the lowered 2nd scale degree, " +
    "usually in first inversion. In C minor: Db-F-Ab. Typically moves to V.",
  counterpoint:
    "Counterpoint is the art of combining melodic lines. Species counterpoint starts with simple note-against-note " +
    "(1st species) and adds complexity. Rules: avoid parallel 5ths/8ves, prefer contrary motion, " +
    "consonant intervals on strong beats.",
};

// ---------------------------------------------------------------------------
//  Register tools
// ---------------------------------------------------------------------------

export function registerTheoryTools(server: McpServer): void {
  // 1. Identify a chord
  server.tool(
    "identify_chord",
    "Identify a chord from a list of note names or pitch classes. " +
      "Example: 'C E G' -> C major. Accepts note names (C, D#, Bb) or MIDI numbers.",
    {
      notes: z.string().describe("Space or comma-separated note names or pitch classes, e.g. 'C E G' or 'C Eb G Bb'"),
      bass: z.string().optional().describe("Optional bass note name for inversion detection, e.g. 'E'"),
    },
    async ({ notes, bass }) => {
      const pcs = parseNoteList(notes);
      if (pcs.length < 2)
        return { content: [{ type: "text" as const, text: "Need at least 2 notes. Example: 'C E G'" }] };

      const bassPc = bass ? parseNoteName(bass) ?? undefined : undefined;
      const chord = T.identifyChord(pcs, bassPc);
      if (!chord)
        return {
          content: [{ type: "text" as const, text: `Could not identify a chord from: ${notes}. Try different notes.` }],
        };

      const rootName = pcName(chord.rootPc);
      const invLabels = ["root position", "1st inversion", "2nd inversion", "3rd inversion"];
      const inv = invLabels[chord.inversion] ?? `inversion ${chord.inversion}`;
      const chordTones = chord.chordPcs.map((pc: number) => pcName(pc)).join(", ");
      const text =
        `**${rootName}${chord.symbol}** (${chord.quality})\n` +
        `Chord tones: ${chordTones}\n` +
        `Triad quality: ${chord.triad}\n` +
        `Position: ${inv}` +
        (chord.extras > 0 ? `\nNon-chord tones detected: ${chord.extras}` : "");

      return { content: [{ type: "text" as const, text }] };
    },
  );

  // 2. Detect key from notes
  server.tool(
    "detect_key",
    "Detect the likely key from a collection of notes. Provide as many notes as possible for accuracy.",
    {
      notes: z.string().describe("Space or comma-separated note names representing pitches in the passage"),
    },
    async ({ notes }) => {
      const pcs = parseNoteList(notes);
      if (pcs.length < 3)
        return { content: [{ type: "text" as const, text: "Need at least 3 notes for key detection." }] };

      const histogram = new Array(12).fill(0) as number[];
      for (const pc of pcs) histogram[T.mod(pc, 12)]++;
      const key = T.detectKey(histogram);
      const name = pcName(key.tonicPc) + " " + key.mode;
      return {
        content: [{ type: "text" as const, text: `Detected key: **${name}**\n(Based on ${pcs.length} pitch samples)` }],
      };
    },
  );

  // 3. Roman numeral analysis
  server.tool(
    "roman_numeral",
    "Get the Roman numeral label for a chord in a given key. " +
      "Also identifies secondary dominants, borrowed chords, and augmented sixths.",
    {
      chord_notes: z.string().describe("Notes of the chord, e.g. 'G B D F'"),
      key: z.string().describe("Key context, e.g. 'C major' or 'A minor'"),
      bass: z.string().optional().describe("Bass note for inversion, e.g. 'B'"),
    },
    async ({ chord_notes, key, bass }) => {
      const pcs = parseNoteList(chord_notes);
      const keyInfo = keyFromString(key);
      if (!keyInfo)
        return { content: [{ type: "text" as const, text: "Invalid key. Use format like 'C major' or 'A minor'." }] };
      if (pcs.length < 2)
        return { content: [{ type: "text" as const, text: "Need at least 2 notes." }] };

      const bassPc = bass ? parseNoteName(bass) ?? undefined : undefined;
      const chord = T.identifyChord(pcs, bassPc);
      if (!chord)
        return { content: [{ type: "text" as const, text: "Could not identify chord." }] };

      const rn = T.romanNumeral(chord, keyInfo);
      const lines = [`**${rn.roman}** in ${pcName(keyInfo.tonicPc)} ${keyInfo.mode}`];

      const sec = T.isSecondaryDominant(chord, keyInfo);
      if (sec) lines.push(`Secondary dominant: V/${sec.target}`);

      if (T.isBorrowed(chord, keyInfo)) lines.push("This is a borrowed chord (mode mixture).");

      const aug6 = T.classifyAugmentedSixth(chord, keyInfo);
      if (aug6) lines.push(`Augmented sixth: ${aug6}`);

      const mixture = T.classifyModeMixture(chord, keyInfo);
      if (mixture) lines.push(`Mode mixture type: ${mixture}`);

      const scales = T.suggestChordScales(chord, keyInfo);
      if (scales && scales.length > 0) lines.push(`Compatible scales: ${scales.join(", ")}`);

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 4. Analyze a chord progression
  server.tool(
    "analyze_progression",
    "Analyze a full chord progression: Roman numerals, cadences, secondary dominants, voice leading. " +
      "Each chord is separated by '|'. Within a chord, notes are space-separated.",
    {
      progression: z
        .string()
        .describe("Chords separated by '|', e.g. 'C E G | F A C | G B D | C E G'"),
      key: z.string().describe("Key context, e.g. 'C major'"),
    },
    async ({ progression, key }) => {
      const keyInfo = keyFromString(key);
      if (!keyInfo)
        return { content: [{ type: "text" as const, text: "Invalid key." }] };

      const chordStrs = progression.split("|").map((s) => s.trim()).filter(Boolean);
      if (chordStrs.length === 0)
        return { content: [{ type: "text" as const, text: "No chords provided." }] };

      const chords: T.ChordInfo[] = [];
      const labels: string[] = [];

      for (const cs of chordStrs) {
        const pcs = parseNoteList(cs);
        const chord = T.identifyChord(pcs, pcs[0]);
        if (!chord) {
          labels.push("?");
          continue;
        }
        chords.push(chord);
        const rn = T.romanNumeral(chord, keyInfo);
        let label = rn.roman;
        const sec = T.isSecondaryDominant(chord, keyInfo);
        if (sec) label += ` (V/${sec.target})`;
        if (T.isBorrowed(chord, keyInfo)) label += " (borrowed)";
        labels.push(`${pcName(chord.rootPc)}${chord.symbol} = ${label}`);
      }

      const lines = ["**Chord-by-chord analysis:**"];
      for (let i = 0; i < labels.length; i++) {
        lines.push(`  ${i + 1}. ${labels[i]}`);
      }

      // Cadences
      if (chords.length >= 2) {
        const cadences = T.detectCadences(chords, keyInfo);
        if (cadences && cadences.length > 0) {
          lines.push("\n**Cadences detected:**");
          for (const c of cadences) lines.push(`  - ${c.label} (${c.type})`);
        }
      }

      // Tension map
      if (chords.length >= 2) {
        const tensions = T.computeHarmonicTension(chords, keyInfo);
        if (tensions && tensions.length > 0) {
          lines.push("\n**Harmonic tension curve:** " + tensions.map((t: number) => t.toFixed(1)).join(" -> "));
        }
      }

      // Harmonic function distribution
      if (chords.length >= 2) {
        const dist = T.harmonicFunctionDistribution(chords, keyInfo);
        if (dist) {
          lines.push(
            `\n**Function distribution:** T=${((dist.T ?? 0) * 100).toFixed(0)}% ` +
              `S=${((dist.S ?? 0) * 100).toFixed(0)}% D=${((dist.D ?? 0) * 100).toFixed(0)}%`,
          );
        }
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 5. Explore scales
  server.tool(
    "explore_scales",
    "Show scales and modes starting on a given root note, or find scales that fit a set of notes.",
    {
      root: z.string().optional().describe("Root note to build scales from, e.g. 'C'"),
      notes: z.string().optional().describe("Notes to fit scales to, e.g. 'C D E G A'"),
    },
    async ({ root, notes }) => {
      if (notes) {
        const pcs = parseNoteList(notes);
        if (pcs.length < 3)
          return { content: [{ type: "text" as const, text: "Need at least 3 notes." }] };
        const fits = T.fitScales(pcs);
        if (!fits || fits.length === 0)
          return { content: [{ type: "text" as const, text: "No matching scales found." }] };
        const lines = ["**Scales matching those notes:**"];
        for (const s of fits.slice(0, 10)) {
          lines.push(`  - ${s.name}: ${s.pitchClasses.map((pc: number) => pcName(pc)).join(", ")}`);
        }
        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      }

      if (root) {
        const rootPc = parseNoteName(root);
        if (rootPc === null)
          return { content: [{ type: "text" as const, text: `Unknown note: ${root}` }] };

        const patterns = T.SCALE_PATTERNS;
        const lines = [`**Scales starting on ${pcName(rootPc)}:**`];
        if (patterns) {
          for (const [name, intervals] of Object.entries(patterns)) {
            const notesInScale = (intervals as number[]).map((i: number) => pcName(T.mod(rootPc + i, 12)));
            lines.push(`  - **${name}**: ${notesInScale.join(", ")}`);
          }
        } else {
          // Fallback: show common scales manually
          const commonScales: [string, number[]][] = [
            ["Major (Ionian)", [0, 2, 4, 5, 7, 9, 11]],
            ["Natural Minor (Aeolian)", [0, 2, 3, 5, 7, 8, 10]],
            ["Harmonic Minor", [0, 2, 3, 5, 7, 8, 11]],
            ["Melodic Minor", [0, 2, 3, 5, 7, 9, 11]],
            ["Dorian", [0, 2, 3, 5, 7, 9, 10]],
            ["Phrygian", [0, 1, 3, 5, 7, 8, 10]],
            ["Lydian", [0, 2, 4, 6, 7, 9, 11]],
            ["Mixolydian", [0, 2, 4, 5, 7, 9, 10]],
            ["Locrian", [0, 1, 3, 5, 6, 8, 10]],
            ["Major Pentatonic", [0, 2, 4, 7, 9]],
            ["Minor Pentatonic", [0, 3, 5, 7, 10]],
            ["Blues", [0, 3, 5, 6, 7, 10]],
            ["Whole Tone", [0, 2, 4, 6, 8, 10]],
            ["Chromatic", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
          ];
          for (const [name, intervals] of commonScales) {
            const notesInScale = intervals.map((i) => pcName(T.mod(rootPc + i, 12)));
            lines.push(`  - **${name}**: ${notesInScale.join(", ")}`);
          }
        }
        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      }

      return { content: [{ type: "text" as const, text: "Provide either 'root' or 'notes'." }] };
    },
  );

  // 6. Identify interval
  server.tool(
    "identify_interval",
    "Identify the interval between two notes.",
    {
      note1: z.string().describe("First note, e.g. 'C'"),
      note2: z.string().describe("Second note, e.g. 'E'"),
    },
    async ({ note1, note2 }) => {
      const pc1 = parseNoteName(note1);
      const pc2 = parseNoteName(note2);
      if (pc1 === null || pc2 === null)
        return { content: [{ type: "text" as const, text: "Invalid note names." }] };

      const semitones = T.mod(pc2 - pc1, 12);
      const name = INTERVAL_NAMES[semitones] ?? `${semitones} semitones`;
      return {
        content: [
          {
            type: "text" as const,
            text: `**${note1} to ${note2}**: ${name} (${semitones} semitones)`,
          },
        ],
      };
    },
  );

  // 7. Generate theory drill
  server.tool(
    "generate_drill",
    "Generate a music theory drill question. Types: interval, chord, scale, roman_numeral, cadence.",
    {
      type: z
        .enum(["interval", "chord", "scale", "roman_numeral", "cadence"])
        .describe("Type of drill to generate"),
      count: z.number().min(1).max(20).default(5).describe("Number of questions"),
    },
    async ({ type, count }) => {
      const generators: Record<string, () => T.DrillQuestion> = {
        interval: T.generateIntervalDrill,
        chord: T.generateChordDrill,
        scale: T.generateScaleDrill,
        roman_numeral: T.generateRomanNumeralQuiz,
        cadence: T.generateCadenceDrill,
      };
      const gen = generators[type];
      if (!gen)
        return { content: [{ type: "text" as const, text: `Unknown drill type: ${type}` }] };

      const questions: string[] = [`**${type.replace("_", " ")} drill** (${count} questions)\n`];
      for (let i = 0; i < count; i++) {
        const q = gen();
        questions.push(`**Q${i + 1}:** ${q.question}`);
        if (q.choices && q.choices.length > 0) {
          questions.push(`  Options: ${q.choices.join(", ")}`);
        }
        questions.push(`  ||Answer: ${q.answer}||\n`);
      }
      return { content: [{ type: "text" as const, text: questions.join("\n") }] };
    },
  );

  // 8. Explain a concept
  server.tool(
    "explain_concept",
    "Explain a music theory concept. Available: interval, chord, roman numeral, cadence, " +
      "secondary dominant, voice leading, mode mixture, scale, augmented sixth, neapolitan, counterpoint.",
    {
      concept: z.string().describe("The concept to explain"),
    },
    async ({ concept }) => {
      const key = concept.toLowerCase().trim();
      // Try exact match, then substring
      let explanation = CONCEPT_LIBRARY[key];
      if (!explanation) {
        for (const [k, v] of Object.entries(CONCEPT_LIBRARY)) {
          if (key.includes(k) || k.includes(key)) {
            explanation = v;
            break;
          }
        }
      }
      if (!explanation) {
        const available = Object.keys(CONCEPT_LIBRARY).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `No built-in explanation for "${concept}". Available: ${available}. ` +
                "You can also ask the LLM to explain it.",
            },
          ],
        };
      }
      return { content: [{ type: "text" as const, text: `**${concept}**\n\n${explanation}` }] };
    },
  );

  // 9. Check voice leading
  server.tool(
    "check_voice_leading",
    "Check a sequence of chords for parallel 5ths, 8ves, and other voice-leading issues. " +
      "Provide chords separated by '|', each with notes from bass to soprano.",
    {
      chords: z
        .string()
        .describe("Chords separated by '|', notes low to high. E.g. 'C E G C | B D G D'"),
      key: z.string().optional().describe("Key context for additional diagnostics"),
    },
    async ({ chords, key }) => {
      const chordStrs = chords.split("|").map((s) => s.trim()).filter(Boolean);
      const events = chordStrs.map((cs) => {
        const pcs = cs
          .split(/[\s,;]+/)
          .map(parseNoteName)
          .filter((n): n is number => n !== null);
        return { pitches: pcs, pitchClasses: pcs.map((p) => T.mod(p, 12)), bassPc: pcs[0] ?? 0 };
      });

      const issues = T.checkParallels(events);
      const lines: string[] = [];

      if (!issues || issues.length === 0) {
        lines.push("No parallel 5ths or 8ves detected. Voice leading looks clean.");
      } else {
        lines.push(`**${issues.length} voice-leading issue(s) found:**`);
        for (const iss of issues) {
          lines.push(`  - ${iss.type}: ${iss.description}`);
        }
      }

      if (key) {
        const keyInfo = keyFromString(key);
        if (keyInfo) {
          const mistakes = T.detectCommonMistakes(events, keyInfo);
          if (mistakes && mistakes.length > 0) {
            lines.push("\n**Common student mistakes:**");
            for (const m of mistakes) lines.push(`  - ${m}`);
          }

          const errors = T.diagnoseErrors(events, keyInfo);
          if (errors && errors.length > 0) {
            lines.push("\n**Diagnostic feedback:**");
            for (const e of errors) lines.push(`  - ${e}`);
          }
        }
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 10. Sight-reading difficulty
  server.tool(
    "sight_reading_difficulty",
    "Score the sight-reading difficulty (1-10) of a passage and get practice tips.",
    {
      notes: z
        .string()
        .describe("Notes in the passage (space-separated MIDI numbers or note names), e.g. '60 64 67 72'"),
    },
    async ({ notes }) => {
      const pitches = notes
        .split(/[\s,;]+/)
        .map((n) => {
          const num = parseInt(n, 10);
          if (!isNaN(num)) return num;
          const pc = parseNoteName(n);
          return pc !== null ? pc + 60 : null; // default to octave 4
        })
        .filter((n): n is number => n !== null);

      if (pitches.length < 2)
        return { content: [{ type: "text" as const, text: "Need at least 2 notes." }] };

      const events = pitches.map((p) => ({ pitches: [p] }));
      const result = T.scoreSightReadingDifficulty(events);
      const lines = [`**Difficulty: ${result.score}/10**`];
      if (result.tips && result.tips.length > 0) {
        lines.push("\n**Practice tips:**");
        for (const t of result.tips) lines.push(`  - ${t}`);
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    },
  );

  // 11. Scale degree ear training hints
  server.tool(
    "ear_training_hint",
    "Get ear-training hints for a scale degree (solfege, character description).",
    {
      degree: z.number().min(1).max(7).describe("Scale degree (1-7)"),
      mode: z.enum(["major", "minor"]).default("major").describe("Major or minor context"),
    },
    async ({ degree, mode }) => {
      const hint = T.getScaleDegreeHint(degree, mode);
      const text = hint ?? `Scale degree ${degree} in ${mode}: no specific hint available.`;
      return { content: [{ type: "text" as const, text }] };
    },
  );
}
