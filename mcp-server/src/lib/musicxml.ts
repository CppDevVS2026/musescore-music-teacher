/**
 * Lightweight MusicXML generator and parser.
 *
 * Generates well-formed MusicXML 4.0 that MuseScore (and Dorico, Finale,
 * Sibelius, etc.) can open.  No external XML library needed — we template
 * the output directly.
 */

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export interface NoteSpec {
  /** MIDI pitch number (e.g. 60 = middle C). */
  pitch: number;
  /** Duration type: "whole", "half", "quarter", "eighth", "16th". */
  duration: string;
  /** If true, note is part of a chord (same onset as previous note). */
  chord?: boolean;
  /** If true, this is a rest instead of a pitched note. */
  rest?: boolean;
}

export interface MeasureSpec {
  notes: NoteSpec[];
  /** Time signature numerator (default 4). */
  timeBeats?: number;
  /** Time signature denominator (default 4). */
  timeBeatType?: number;
  /** Key signature fifths (-7..+7, default 0 = C major). */
  keyFifths?: number;
}

export interface ScoreSpec {
  title?: string;
  composer?: string;
  measures: MeasureSpec[];
  /** Instrument name (default "Piano"). */
  instrument?: string;
}

export interface ParsedNote {
  pitch: number;
  step: string;
  octave: number;
  alter: number;
  duration: string;
  chord: boolean;
  rest: boolean;
  measure: number;
}

// ---------------------------------------------------------------------------
//  MIDI pitch <-> MusicXML step/octave/alter
// ---------------------------------------------------------------------------

const STEP_MAP: [string, number][] = [
  ["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0],
  ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0],
];

function midiToXml(midi: number): { step: string; octave: number; alter: number } {
  const octave = Math.floor(midi / 12) - 1;
  const pc = midi % 12;
  const [step, alter] = STEP_MAP[pc];
  return { step, octave, alter };
}

function xmlToMidi(step: string, octave: number, alter: number): number {
  const stepSemitones: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  return (octave + 1) * 12 + (stepSemitones[step] ?? 0) + alter;
}

// Duration type -> quarter-note divisions (assuming divisions=1).
const DURATION_DIVISIONS: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  "16th": 0.25,
};

// ---------------------------------------------------------------------------
//  MusicXML generation
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function noteToXml(n: NoteSpec): string {
  const lines: string[] = [];
  lines.push("        <note>");

  if (n.chord) lines.push("          <chord/>");

  if (n.rest) {
    lines.push("          <rest/>");
  } else {
    const { step, octave, alter } = midiToXml(n.pitch);
    lines.push("          <pitch>");
    lines.push(`            <step>${step}</step>`);
    if (alter !== 0) lines.push(`            <alter>${alter}</alter>`);
    lines.push(`            <octave>${octave}</octave>`);
    lines.push("          </pitch>");
  }

  const dur = DURATION_DIVISIONS[n.duration] ?? 1;
  lines.push(`          <duration>${dur}</duration>`);
  lines.push(`          <type>${n.duration}</type>`);
  lines.push("        </note>");
  return lines.join("\n");
}

export function generateMusicXml(spec: ScoreSpec): string {
  const title = spec.title ?? "Untitled";
  const composer = spec.composer ?? "";
  const instrument = spec.instrument ?? "Piano";

  const parts: string[] = [];

  for (let mi = 0; mi < spec.measures.length; mi++) {
    const m = spec.measures[mi];
    const mLines: string[] = [];
    mLines.push(`      <measure number="${mi + 1}">`);

    // Attributes on first measure (or when signature changes)
    if (mi === 0) {
      mLines.push("        <attributes>");
      mLines.push("          <divisions>1</divisions>");
      mLines.push("          <key>");
      mLines.push(`            <fifths>${m.keyFifths ?? 0}</fifths>`);
      mLines.push("          </key>");
      mLines.push("          <time>");
      mLines.push(`            <beats>${m.timeBeats ?? 4}</beats>`);
      mLines.push(`            <beat-type>${m.timeBeatType ?? 4}</beat-type>`);
      mLines.push("          </time>");
      mLines.push("          <clef>");
      mLines.push("            <sign>G</sign>");
      mLines.push("            <line>2</line>");
      mLines.push("          </clef>");
      mLines.push("        </attributes>");
    }

    for (const note of m.notes) {
      mLines.push(noteToXml(note));
    }

    mLines.push("      </measure>");
    parts.push(mLines.join("\n"));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${escapeXml(title)}</work-title>
  </work>
  <identification>
    <creator type="composer">${escapeXml(composer)}</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>${escapeXml(instrument)}</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${parts.join("\n")}
  </part>
</score-partwise>
`;
}

// ---------------------------------------------------------------------------
//  MusicXML parsing (minimal — handles MuseScore & standard exports)
// ---------------------------------------------------------------------------

/** Simple regex-based XML value extractor (no DOM parser needed). */
function tagValue(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function allMatches(xml: string, re: RegExp): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m);
  return results;
}

export function parseMusicXml(xml: string): {
  title: string;
  notes: ParsedNote[];
} {
  const title = tagValue(xml, "work-title") || tagValue(xml, "movement-title") || "Untitled";
  const notes: ParsedNote[] = [];

  // Split into measures
  const measureRe = /<measure[^>]*number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/gi;
  for (const mm of allMatches(xml, measureRe)) {
    const measureNum = parseInt(mm[1], 10);
    const measureBody = mm[2];

    // Split into notes
    const noteRe = /<note>([\s\S]*?)<\/note>/gi;
    for (const nm of allMatches(measureBody, noteRe)) {
      const noteBody = nm[1];
      const isRest = /<rest\s*\/?>/.test(noteBody);
      const isChord = /<chord\s*\/?>/.test(noteBody);
      const durType = tagValue(noteBody, "type") || "quarter";

      if (isRest) {
        notes.push({
          pitch: 0,
          step: "",
          octave: 0,
          alter: 0,
          duration: durType,
          chord: isChord,
          rest: true,
          measure: measureNum,
        });
      } else {
        const step = tagValue(noteBody, "step");
        const octave = parseInt(tagValue(noteBody, "octave") || "4", 10);
        const alter = parseInt(tagValue(noteBody, "alter") || "0", 10);
        const midi = xmlToMidi(step, octave, alter);
        notes.push({
          pitch: midi,
          step,
          octave,
          alter,
          duration: durType,
          chord: isChord,
          rest: false,
          measure: measureNum,
        });
      }
    }
  }

  return { title, notes };
}
