/**
 * Typed wrapper around the pure-JS theory engine (../../MusicTeacher/theory.js).
 *
 * theory.js is an ES5 CommonJS module that runs under Node.  We `require()` it
 * at runtime so we get the canonical implementation without reimplementing
 * 3 000+ lines of music theory.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const theoryPath = path.resolve(__dirname, "..", "..", "..", "MusicTeacher", "theory.js");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T: Record<string, any> = require(theoryPath);

// ---------------------------------------------------------------------------
//  Re-export typed helpers
// ---------------------------------------------------------------------------

export interface ChordInfo {
  rootPc: number;
  quality: string;
  symbol: string;
  triad: string;
  intervals: number[];
  inversion: number;
  bassPc: number;
  chordPcs: number[];
  extras: number;
}

export interface KeyInfo {
  tonicPc: number;
  mode: "major" | "minor";
}

export interface RomanInfo {
  roman: string;
  applied?: string;
}

export interface MediantInfo {
  type: string;
  commonTones: number;
  sameQuality?: boolean;
}

export interface CadenceInfo {
  type: string;
  label: string;
}

export interface VoiceLeadingIssue {
  type: string;
  description: string;
  voice1: number;
  voice2: number;
}

export interface DrillQuestion {
  question: string;
  answer: string;
  choices?: string[];
}

export interface DifficultyResult {
  score: number;
  tips: string[];
}

export interface ScaleInfo {
  name: string;
  pitchClasses: number[];
}

// Utility
export const mod: (n: number, m: number) => number = T.mod;
export const tpcToPc: (tpc: number) => number = T.tpcToPc;
export const tpcToName: (tpc: number) => string = T.tpcToName;
export const pcToName: (pc: number, preferFlats?: boolean) => string = T.pcToName;

// Chord recognition
export const identifyChord: (pcs: number[], bassPc?: number) => ChordInfo | null = T.identifyChord;

// Key detection
export const detectKey: (histogram: number[]) => KeyInfo = T.detectKey;

// Roman numerals
export const romanNumeral: (chord: ChordInfo, key: KeyInfo) => RomanInfo = T.romanNumeral;

// Mediant classification
export const classifyMediant: (a: ChordInfo, b: ChordInfo) => MediantInfo | null = T.classifyMediant;

// Cadence detection
export const detectCadences: (chords: ChordInfo[], key: KeyInfo) => CadenceInfo[] = T.detectCadences;

// Voice leading
export const checkParallels: (events: Array<{ pitches: number[] }>) => VoiceLeadingIssue[] = T.checkParallels;

// Secondary dominants
export const isSecondaryDominant: (chord: ChordInfo, key: KeyInfo) => { target: string } | null = T.isSecondaryDominant;

// Borrowed chords
export const isBorrowed: (chord: ChordInfo, key: KeyInfo) => boolean = T.isBorrowed;

// Scale exploration
export const SCALE_PATTERNS: Record<string, number[]> = T.SCALE_PATTERNS;
export const fitScales: (pcs: number[]) => ScaleInfo[] = T.fitScales;

// Drills
export const generateIntervalDrill: () => DrillQuestion = T.generateIntervalDrill;
export const generateChordDrill: () => DrillQuestion = T.generateChordDrill;
export const generateScaleDrill: () => DrillQuestion = T.generateScaleDrill;
export const generateRomanNumeralQuiz: () => DrillQuestion = T.generateRomanNumeralQuiz;
export const generateCadenceDrill: () => DrillQuestion = T.generateCadenceDrill;

// Teaching
export const TEACHING_MESSAGES: Record<string, string> = T.TEACHING_MESSAGES;
export const SCALE_DEGREE_HINTS: Record<string, string> = T.SCALE_DEGREE_HINTS;
export const getScaleDegreeHint: (degree: number, mode: string) => string = T.getScaleDegreeHint;
export const diagnoseErrors: (events: Array<{ pitches: number[] }>, key: KeyInfo) => string[] = T.diagnoseErrors;
export const detectCommonMistakes: (events: Array<{ pitches: number[] }>, key: KeyInfo) => string[] = T.detectCommonMistakes;
export const generateGuidedAnalysis: (events: Array<{ pitchClasses: number[]; bassPc: number }>, key: KeyInfo) => string[] = T.generateGuidedAnalysis;
export const generatePracticeTips: (result: DifficultyResult) => string[] = T.generatePracticeTips;

// Difficulty
export const scoreSightReadingDifficulty: (events: Array<{ pitches: number[] }>) => DifficultyResult = T.scoreSightReadingDifficulty;

// Advanced analysis
export const classifyModeMixture: (chord: ChordInfo, key: KeyInfo) => string | null = T.classifyModeMixture;
export const traceSecondaryChain: (chords: ChordInfo[], key: KeyInfo) => string[] = T.traceSecondaryChain;
export const computeHarmonicTension: (chords: ChordInfo[], key: KeyInfo) => number[] = T.computeHarmonicTension;
export const classifyAugmentedSixth: (chord: ChordInfo, key: KeyInfo) => string | null = T.classifyAugmentedSixth;
export const suggestChordScales: (chord: ChordInfo, key: KeyInfo) => string[] = T.suggestChordScales;
export const detectPlaning: (chords: ChordInfo[]) => boolean = T.detectPlaning;
export const classifyTexture: (events: Array<{ pitches: number[] }>) => string = T.classifyTexture;
export const harmonicFunctionDistribution: (chords: ChordInfo[], key: KeyInfo) => Record<string, number> = T.harmonicFunctionDistribution;

// Provide raw access for anything not explicitly typed
export { T as raw };
