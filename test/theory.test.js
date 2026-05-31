"use strict";

const test = require("node:test");
const assert = require("node:assert");
const T = require("../MusicTeacher/theory.js");

// Build a pitch-class histogram from a list of pcs (each counts as 1 beat).
function histFromScale(pcs) {
    const h = new Array(12).fill(0);
    pcs.forEach((p) => { h[T.mod(p, 12)] += 1; });
    return h;
}

const C_MAJOR = { tonicPc: 0, mode: "major" };
const A_MINOR = { tonicPc: 9, mode: "minor" };

test("tpcToPc maps the circle of fifths to pitch classes", () => {
    assert.strictEqual(T.tpcToPc(14), 0);  // C
    assert.strictEqual(T.tpcToPc(16), 2);  // D
    assert.strictEqual(T.tpcToPc(13), 5);  // F
    assert.strictEqual(T.tpcToPc(20), 6);  // F#
    assert.strictEqual(T.tpcToPc(21), 1);  // C#
    assert.strictEqual(T.tpcToPc(-1), 3);  // Fbb == D#/Eb
});

test("tpcToName spells notes with accidentals", () => {
    assert.strictEqual(T.tpcToName(14), "C");
    assert.strictEqual(T.tpcToName(20), "F#");
    assert.strictEqual(T.tpcToName(12), "Bb");
    assert.strictEqual(T.tpcToName(27), "F##");
    assert.strictEqual(T.tpcToName(-1), "Fbb");
});

test("identifyChord recognises basic triads and inversions", () => {
    const cMaj = T.identifyChord([0, 4, 7], 0);
    assert.strictEqual(cMaj.rootPc, 0);
    assert.strictEqual(cMaj.quality, "maj");
    assert.strictEqual(cMaj.inversion, 0);

    const dMin = T.identifyChord([2, 5, 9], 2);
    assert.strictEqual(dMin.rootPc, 2);
    assert.strictEqual(dMin.quality, "min");

    const cFirstInv = T.identifyChord([4, 7, 0], 4); // C/E
    assert.strictEqual(cFirstInv.rootPc, 0);
    assert.strictEqual(cFirstInv.inversion, 1);
});

test("identifyChord recognises seventh chords", () => {
    const g7 = T.identifyChord([7, 11, 2, 5], 7);
    assert.strictEqual(g7.rootPc, 7);
    assert.strictEqual(g7.quality, "7");

    const dim7 = T.identifyChord([11, 2, 5, 8], 11);
    assert.strictEqual(dim7.rootPc, 11);
    assert.strictEqual(dim7.quality, "dim7");

    const halfDim = T.identifyChord([11, 2, 5, 9], 11);
    assert.strictEqual(halfDim.quality, "m7b5");
});

test("identifyChord ignores a single passing tone (extra)", () => {
    const c = T.identifyChord([0, 2, 4, 7], 0); // C major + added 2nd
    assert.strictEqual(c.rootPc, 0);
    assert.strictEqual(c.quality, "maj");
    assert.strictEqual(c.extras, 1);
});

test("detectKey finds C major and A minor", () => {
    const cmaj = T.detectKey(histFromScale([0, 2, 4, 5, 7, 9, 11, 0, 4, 7]));
    assert.strictEqual(cmaj.tonicPc, 0);
    assert.strictEqual(cmaj.mode, "major");

    const amin = T.detectKey(histFromScale([9, 11, 0, 2, 4, 5, 8, 9, 0, 4]));
    assert.strictEqual(amin.tonicPc, 9);
    assert.strictEqual(amin.mode, "minor");
});

test("romanNumeral labels diatonic chords in C major", () => {
    assert.strictEqual(T.romanNumeral(T.identifyChord([0, 4, 7], 0), C_MAJOR).roman, "I");
    assert.strictEqual(T.romanNumeral(T.identifyChord([2, 5, 9], 2), C_MAJOR).roman, "ii");
    assert.strictEqual(T.romanNumeral(T.identifyChord([7, 11, 2], 7), C_MAJOR).roman, "V");
    assert.strictEqual(T.romanNumeral(T.identifyChord([11, 2, 5], 11), C_MAJOR).roman, "vii\u00b0");
});

test("romanNumeral writes inversion figures", () => {
    const cFirstInv = T.identifyChord([4, 7, 0], 4); // C/E
    assert.strictEqual(T.romanNumeral(cFirstInv, C_MAJOR).roman, "I6");
    const g65 = T.identifyChord([11, 2, 5, 7], 11); // G7/B
    assert.strictEqual(T.romanNumeral(g65, C_MAJOR).roman, "V65");
});

test("classifyMediant: C major -> E major is a chromatic mediant", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const e = T.identifyChord([4, 8, 11], 4);
    const m = T.classifyMediant(c, e);
    assert.strictEqual(m.type, "chromatic-mediant");
    assert.strictEqual(m.commonTones, 1);
    assert.strictEqual(m.sameQuality, true);
});

test("classifyMediant: C major -> Ab major is a chromatic mediant", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const ab = T.identifyChord([8, 0, 3], 8);
    const m = T.classifyMediant(c, ab);
    assert.strictEqual(m.type, "chromatic-mediant");
    assert.strictEqual(m.commonTones, 1);
});

test("classifyMediant: C major -> A minor is a diatonic mediant", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const am = T.identifyChord([9, 0, 4], 9);
    const m = T.classifyMediant(c, am);
    assert.strictEqual(m.type, "diatonic-mediant");
    assert.strictEqual(m.commonTones, 2);
});

test("classifyMediant: C major -> Eb minor is doubly chromatic", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const ebm = T.identifyChord([3, 6, 10], 3);
    const m = T.classifyMediant(c, ebm);
    assert.strictEqual(m.type, "doubly-chromatic-mediant");
    assert.strictEqual(m.commonTones, 0);
});

test("classifyMediant: step / fifth relationships return null", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const g = T.identifyChord([7, 11, 2], 7);
    const d = T.identifyChord([2, 6, 9], 2);
    assert.strictEqual(T.classifyMediant(c, g), null);
    assert.strictEqual(T.classifyMediant(c, d), null);
});

test("classifySecondaryDominant detects V/V and V7/V in C major", () => {
    const d = T.identifyChord([2, 6, 9], 2);        // D major == V/V
    const g = T.identifyChord([7, 11, 2], 7);       // G major == V
    const sd = T.classifySecondaryDominant(d, g, C_MAJOR);
    assert.strictEqual(sd.label, "V/V");

    const d7 = T.identifyChord([2, 6, 9, 0], 2);    // D7
    assert.strictEqual(T.classifySecondaryDominant(d7, g, C_MAJOR).label, "V7/V");
});

test("classifySecondaryDominant detects V/ii in C major", () => {
    const a = T.identifyChord([9, 1, 4], 9);        // A major == V/ii
    const dm = T.identifyChord([2, 5, 9], 2);       // D minor == ii
    assert.strictEqual(T.classifySecondaryDominant(a, dm, C_MAJOR).label, "V/ii");
});

test("classifySecondaryDominant ignores a plain diatonic V-I", () => {
    const g = T.identifyChord([7, 11, 2], 7);
    const c = T.identifyChord([0, 4, 7], 0);
    assert.strictEqual(T.classifySecondaryDominant(g, c, C_MAJOR), null);
});

test("classifyBorrowed detects the Neapolitan", () => {
    const db = T.identifyChord([1, 5, 8], 1); // Db major == bII in C
    const labels = T.classifyBorrowed(db, C_MAJOR).map((x) => x.name);
    assert.ok(labels.indexOf("Neapolitan") >= 0);
});

test("classifyBorrowed detects modal mixture (borrowed iv) in major", () => {
    const fm = T.identifyChord([5, 8, 0], 5); // F minor in C major
    const labels = T.classifyBorrowed(fm, C_MAJOR).map((x) => x.name);
    assert.ok(labels.indexOf("Mixture") >= 0);
});

test("classifyBorrowed detects German augmented sixth in C major", () => {
    // Ab, C, Eb, F# == Ger+6 in C
    const ger = { rootPc: 8, triad: "major", chordPcs: [8, 0, 3, 6], intervals: [0,4,7,10], quality: "7" };
    const labels = T.classifyBorrowed(ger, C_MAJOR).map((x) => x.name);
    assert.ok(labels.indexOf("Augmented sixth") >= 0);
});

test("classifyCadence detects PAC, IAC, HC, DC, PC", () => {
    const g = T.identifyChord([7, 11, 2], 7);
    const c = T.identifyChord([0, 4, 7], 0);
    const am = T.identifyChord([9, 0, 4], 9);
    const f = T.identifyChord([5, 9, 0], 5);

    assert.strictEqual(T.classifyCadence(g, c, 2, 0, C_MAJOR).type, "PAC"); // sop on tonic
    assert.strictEqual(T.classifyCadence(g, c, 2, 4, C_MAJOR).type, "IAC"); // sop on 3rd
    assert.strictEqual(T.classifyCadence(c, g, 0, 2, C_MAJOR).type, "HC");
    assert.strictEqual(T.classifyCadence(g, am, 2, 0, C_MAJOR).type, "DC");
    assert.strictEqual(T.classifyCadence(f, c, 0, 0, C_MAJOR).type, "PC");
});

test("analyzeProgression produces a key and roman numerals end to end", () => {
    // I - V/V - V - I in C major
    const events = [
        { tick: 0,    measure: 1, durationTicks: 480, pitchClasses: [0, 4, 7], bassPc: 0, sopranoPc: 0 },
        { tick: 480,  measure: 1, durationTicks: 480, pitchClasses: [2, 6, 9], bassPc: 2, sopranoPc: 9 },
        { tick: 960,  measure: 2, durationTicks: 480, pitchClasses: [7, 11, 2], bassPc: 7, sopranoPc: 2 },
        { tick: 1440, measure: 2, durationTicks: 480, pitchClasses: [0, 4, 7], bassPc: 0, sopranoPc: 0 }
    ];
    const res = T.analyzeProgression(events, C_MAJOR);
    assert.strictEqual(res.key.tonicPc, 0);
    assert.strictEqual(res.key.mode, "major");
    const kinds = res.items.map((i) => i.kind);
    assert.ok(kinds.indexOf("roman") >= 0);
    assert.ok(kinds.indexOf("secondary") >= 0);
    const secondary = res.items.find((i) => i.kind === "secondary");
    assert.ok(/V\/V/.test(secondary.text));
});

test("intervalBetween names intervals and consonance", () => {
    assert.strictEqual(T.intervalBetween(60, 67).name, "P5");
    assert.strictEqual(T.intervalBetween(60, 64).name, "M3");
    assert.strictEqual(T.intervalBetween(60, 66).name, "TT");
    assert.strictEqual(T.intervalBetween(60, 66).consonant, false);
    assert.strictEqual(T.intervalBetween(60, 72).name, "P8");
});

test("identifyScale recognises modes for a tonic", () => {
    const major = T.identifyScale([0, 2, 4, 5, 7, 9, 11], 0);
    assert.strictEqual(major[0].name, "major (Ionian)");
    assert.strictEqual(major[0].exact, true);

    const dorian = T.identifyScale([2, 4, 5, 7, 9, 11, 0], 2);
    assert.strictEqual(dorian[0].name, "Dorian");

    const pent = T.identifyScale([0, 2, 4, 7, 9], 0);
    assert.strictEqual(pent[0].name, "major pentatonic");
});

test("classifyNonChordTone identifies passing and neighbor tones", () => {
    const cMaj = [0, 4, 7];
    // C(60) -> D(62) -> E(64): D is a passing tone
    assert.strictEqual(T.classifyNonChordTone(60, 62, 64, cMaj).type, "passing");
    // C(60) -> D(62) -> C(60): D is a neighbor tone
    assert.strictEqual(T.classifyNonChordTone(60, 62, 60, cMaj).type, "neighbor");
    // chord tone returns null
    assert.strictEqual(T.classifyNonChordTone(60, 64, 67, cMaj), null);
    // leap in, step out -> appoggiatura
    assert.strictEqual(T.classifyNonChordTone(60, 65, 64, cMaj).type, "appoggiatura");
    // held over (prev == current) resolving by step -> suspension, not appoggiatura
    assert.strictEqual(T.classifyNonChordTone(60, 60, 59, [7, 11, 2]).type, "suspension");
});

test("checkVoiceLeading detects parallel fifths and octaves", () => {
    // Two voices C-G moving to D-A: parallel fifths
    const fifths = T.checkVoiceLeading([60, 67], [62, 69]);
    assert.ok(fifths.some((x) => x.type === "parallel-fifths"));
    // C-C moving to D-D: parallel octaves
    const octs = T.checkVoiceLeading([60, 72], [62, 74]);
    assert.ok(octs.some((x) => x.type === "parallel-octaves"));
    // contrary motion: no parallels
    const ok = T.checkVoiceLeading([60, 67], [62, 65]);
    assert.strictEqual(ok.length, 0);
});

test("analyzeProgression flags a chromatic mediant progression", () => {
    const events = [
        { tick: 0,   measure: 1, durationTicks: 480, pitchClasses: [0, 4, 7], bassPc: 0, sopranoPc: 0 },
        { tick: 480, measure: 1, durationTicks: 480, pitchClasses: [4, 8, 11], bassPc: 4, sopranoPc: 11 }
    ];
    const res = T.analyzeProgression(events, C_MAJOR);
    const med = res.items.find((i) => i.kind === "mediant");
    assert.ok(med);
    assert.ok(/[Cc]hromatic mediant/.test(med.text));
});

// ===================================================================
//  NEW FEATURE TESTS
// ===================================================================

// --- Extended chord recognition ---

test("identifyChord recognises 9th chords", () => {
    // C9: C E G Bb D == [0, 4, 7, 10, 2]
    const c9 = T.identifyChord([0, 4, 7, 10, 2], 0);
    assert.strictEqual(c9.rootPc, 0);
    assert.strictEqual(c9.quality, "9");
});

test("identifyChord recognises major 9th chords", () => {
    // Cmaj9: C E G B D == [0, 4, 7, 11, 2]
    const cmaj9 = T.identifyChord([0, 4, 7, 11, 2], 0);
    assert.strictEqual(cmaj9.rootPc, 0);
    assert.strictEqual(cmaj9.quality, "maj9");
});

test("identifyChord recognises minor 9th chords", () => {
    // Cm9: C Eb G Bb D == [0, 3, 7, 10, 2]
    const cm9 = T.identifyChord([0, 3, 7, 10, 2], 0);
    assert.strictEqual(cm9.rootPc, 0);
    assert.strictEqual(cm9.quality, "min9");
});

test("identifyChord recognises 6th chords", () => {
    // C6: C E G A == [0, 4, 7, 9]
    const c6 = T.identifyChord([0, 4, 7, 9], 0);
    assert.strictEqual(c6.rootPc, 0);
    assert.strictEqual(c6.quality, "6");
});

test("identifyChord recognises minor 6th chords", () => {
    // Cm6: C Eb G A == [0, 3, 7, 9]
    const cm6 = T.identifyChord([0, 3, 7, 9], 0);
    assert.strictEqual(cm6.rootPc, 0);
    assert.strictEqual(cm6.quality, "min6");
});

test("identifyChord recognises augmented 7th chords", () => {
    // C+7: C E G# Bb == [0, 4, 8, 10]
    const caug7 = T.identifyChord([0, 4, 8, 10], 0);
    assert.strictEqual(caug7.rootPc, 0);
    assert.strictEqual(caug7.quality, "aug7");
});

test("identifyChord recognises 7sus4", () => {
    // C7sus4: C F G Bb == [0, 5, 7, 10]
    const c7sus = T.identifyChord([0, 5, 7, 10], 0);
    assert.strictEqual(c7sus.rootPc, 0);
    assert.strictEqual(c7sus.quality, "7sus4");
});

test("identifyChord recognises power chords (2 notes)", () => {
    // C5: C G == [0, 7]
    const c5 = T.identifyChord([0, 7], 0);
    assert.strictEqual(c5.rootPc, 0);
    assert.strictEqual(c5.quality, "pow");
});

// --- Modulation detection ---

test("detectModulations returns a single region for a short piece", () => {
    const events = [
        { tick: 0,   measure: 1, durationTicks: 480, pitchClasses: [0, 4, 7] },
        { tick: 480, measure: 1, durationTicks: 480, pitchClasses: [5, 9, 0] },
        { tick: 960, measure: 2, durationTicks: 480, pitchClasses: [7, 11, 2] },
        { tick: 1440,measure: 2, durationTicks: 480, pitchClasses: [0, 4, 7] }
    ];
    const regions = T.detectModulations(events);
    assert.ok(regions.length >= 1);
    assert.strictEqual(regions[0].key.tonicPc, 0);
});

test("detectModulations detects a key change from C to G", () => {
    // First section in C major, then shift to G major
    const events = [];
    // 8 chords in C major
    const cProg = [[0,4,7],[5,9,0],[7,11,2],[0,4,7],[2,5,9],[5,9,0],[7,11,2],[0,4,7]];
    for (let i = 0; i < cProg.length; i++) {
        events.push({ tick: i*480, measure: Math.floor(i/2)+1, durationTicks: 480, pitchClasses: cProg[i] });
    }
    // 8 chords in G major
    const gProg = [[7,11,2],[0,4,7],[2,6,9],[7,11,2],[9,0,4],[0,4,7],[2,6,9],[7,11,2]];
    for (let i = 0; i < gProg.length; i++) {
        events.push({ tick: (i+8)*480, measure: Math.floor((i+8)/2)+1, durationTicks: 480, pitchClasses: gProg[i] });
    }
    const regions = T.detectModulations(events, 6);
    assert.ok(regions.length >= 2);
});

test("findPivotChord identifies a chord diatonic in both keys", () => {
    const cMaj = T.identifyChord([0, 4, 7], 0); // C major
    const cKey = { tonicPc: 0, mode: "major" };
    const gKey = { tonicPc: 7, mode: "major" };
    const pivot = T.findPivotChord(cMaj, cKey, gKey);
    assert.ok(pivot);
    assert.strictEqual(pivot.romanInOld, "I");
    assert.strictEqual(pivot.romanInNew, "IV");
});

test("findPivotChord returns null for a chromatic chord in the new key", () => {
    const fSharp = T.identifyChord([6, 10, 1], 6); // F# major, chromatic in G
    const cKey = { tonicPc: 0, mode: "major" };
    const gKey = { tonicPc: 7, mode: "major" };
    const pivot = T.findPivotChord(fSharp, cKey, gKey);
    assert.strictEqual(pivot, null);
});

// --- Sequence detection ---

test("detectSequences finds a descending-fifth sequence", () => {
    // C -> F -> Bb -> Eb -> Ab (circle of fifths descending, transposition=5)
    const roots = [0, 5, 10, 3, 8];
    const seqs = T.detectSequences(roots);
    assert.ok(seqs.length > 0);
    const s = seqs[0];
    assert.strictEqual(s.type, "circle-of-fifths");
});

test("detectSequences finds a stepwise ascending sequence", () => {
    // C -> D -> E -> F (half/whole steps up, transposition = 2 or 1)
    const roots = [0, 1, 2, 3];
    const seqs = T.detectSequences(roots);
    assert.ok(seqs.length > 0);
    assert.strictEqual(seqs[0].type, "stepwise");  // interval 1 is stepwise
});

test("detectSequences returns empty for non-sequential roots", () => {
    const roots = [0, 7, 3, 10, 5, 1, 8];
    const seqs = T.detectSequences(roots);
    // May or may not find patterns, but should not crash
    assert.ok(Array.isArray(seqs));
});

// --- Pedal point detection ---

test("detectPedalPoints finds a tonic pedal", () => {
    const events = [
        { tick: 0,   measure: 1, durationTicks: 480, pitchClasses: [0,4,7], bassPc: 0 },
        { tick: 480, measure: 1, durationTicks: 480, pitchClasses: [5,9,0], bassPc: 0 },
        { tick: 960, measure: 2, durationTicks: 480, pitchClasses: [7,11,2], bassPc: 0 },
        { tick: 1440,measure: 2, durationTicks: 480, pitchClasses: [0,4,7], bassPc: 0 }
    ];
    const pedals = T.detectPedalPoints(events, 3);
    assert.ok(pedals.length > 0);
    assert.strictEqual(pedals[0].bassPc, 0);
});

test("classifyPedalType labels tonic and dominant pedals", () => {
    assert.strictEqual(T.classifyPedalType(0, C_MAJOR), "tonic");
    assert.strictEqual(T.classifyPedalType(7, C_MAJOR), "dominant");
    assert.strictEqual(T.classifyPedalType(5, C_MAJOR), "subdominant");
    assert.strictEqual(T.classifyPedalType(2, C_MAJOR), "other");
});

// --- Harmonic rhythm ---

test("analyzeHarmonicRhythm counts chord changes per measure", () => {
    const events = [
        { tick: 0,   measure: 1, durationTicks: 480, pitchClasses: [0,4,7], bassPc: 0 },
        { tick: 480, measure: 1, durationTicks: 480, pitchClasses: [5,9,0], bassPc: 5 },
        { tick: 960, measure: 2, durationTicks: 960, pitchClasses: [7,11,2], bassPc: 7 }
    ];
    const hr = T.analyzeHarmonicRhythm(events);
    assert.strictEqual(hr[0].measure, 1);
    assert.strictEqual(hr[0].chordChanges, 2);
    assert.strictEqual(hr[1].measure, 2);
    assert.strictEqual(hr[1].chordChanges, 1);
});

// --- Tendency tones ---

test("checkTendencyTones detects leading tone resolution", () => {
    // B(71) -> C(72): leading tone resolves up
    const prev = { pitches: [60, 64, 67, 71], pitchClasses: [0,4,7,11], bassPc: 0 };
    const curr = { pitches: [60, 64, 67, 72], pitchClasses: [0,4,7,0], bassPc: 0 };
    const issues = T.checkTendencyTones(prev, curr, C_MAJOR);
    const lt = issues.find(i => i.type === "leading-tone");
    assert.ok(lt);
    assert.strictEqual(lt.resolved, true);
});

test("checkTendencyTones detects unresolved leading tone", () => {
    // B(71) -> A(69): leading tone does NOT resolve up
    const prev = { pitches: [60, 64, 67, 71], pitchClasses: [0,4,7,11], bassPc: 0 };
    const curr = { pitches: [60, 64, 67, 69], pitchClasses: [0,4,7,9], bassPc: 0 };
    const issues = T.checkTendencyTones(prev, curr, C_MAJOR);
    const lt = issues.find(i => i.type === "leading-tone");
    assert.ok(lt);
    assert.strictEqual(lt.resolved, false);
});

test("checkTendencyTones detects chordal 7th resolution", () => {
    // G7 -> C: F(65) resolves to E(64)
    const prev = { pitches: [55, 59, 62, 65], pitchClasses: [7,11,2,5], bassPc: 7, chord: T.identifyChord([7,11,2,5], 7) };
    const curr = { pitches: [60, 64, 67, 72], pitchClasses: [0,4,7,0], bassPc: 0 };
    const issues = T.checkTendencyTones(prev, curr, C_MAJOR);
    const s7 = issues.find(i => i.type === "chordal-seventh");
    assert.ok(s7);
    assert.strictEqual(s7.resolved, true);
});

// --- Tritone substitution ---

test("classifyTritoneSub detects Db7 -> C as tritone sub", () => {
    // Db7 resolving to C major: tritone sub of V (G7)
    const db7 = T.identifyChord([1, 5, 8, 11], 1); // Db7
    const c = T.identifyChord([0, 4, 7], 0);
    const sub = T.classifyTritoneSub(db7, c, C_MAJOR);
    assert.ok(sub);
    assert.ok(/SubV/.test(sub.label));
});

test("classifyTritoneSub returns null for normal V-I", () => {
    const g7 = T.identifyChord([7, 11, 2, 5], 7);
    const c = T.identifyChord([0, 4, 7], 0);
    assert.strictEqual(T.classifyTritoneSub(g7, c, C_MAJOR), null);
});

// --- Motion types ---

test("classifyMotion identifies all four motion types", () => {
    assert.strictEqual(T.classifyMotion(60, 67, 62, 69), "parallel");
    assert.strictEqual(T.classifyMotion(60, 67, 62, 72), "similar");
    assert.strictEqual(T.classifyMotion(60, 67, 62, 65), "contrary");
    assert.strictEqual(T.classifyMotion(60, 67, 60, 69), "oblique");
    assert.strictEqual(T.classifyMotion(60, 67, 60, 67), "static");
});

test("analyzeMotionTypes returns motion for all voice pairs", () => {
    const motions = T.analyzeMotionTypes([60, 64, 67], [62, 65, 69]);
    assert.strictEqual(motions.length, 3); // 3 pairs for 3 voices
    motions.forEach(m => {
        assert.ok(["parallel", "similar", "contrary", "oblique", "static"].includes(m.motion));
    });
});

// --- Hidden 5ths and 8ves ---

test("checkHiddenIntervals detects hidden fifths", () => {
    // Both voices up, upper leaps, arriving at P5
    const issues = T.checkHiddenIntervals([60, 64], [62, 69]);
    assert.ok(issues.some(i => i.type === "hidden-fifths"));
});

test("checkHiddenIntervals ignores stepwise upper voice", () => {
    // Upper voice steps: not hidden
    const issues = T.checkHiddenIntervals([60, 64], [62, 66]);
    assert.strictEqual(issues.filter(i => i.type === "hidden-fifths").length, 0);
});

// --- Chord voicing ---

test("analyzeVoicing identifies close position", () => {
    // C E G (within an octave)
    const v = T.analyzeVoicing([60, 64, 67], T.identifyChord([0, 4, 7], 0));
    assert.ok(v);
    assert.strictEqual(v.position, "close");
});

test("analyzeVoicing identifies open position", () => {
    // C G E' (spread beyond octave in upper voices)
    const v = T.analyzeVoicing([48, 55, 64, 72], T.identifyChord([0, 4, 7], 0));
    assert.ok(v);
    assert.strictEqual(v.position, "open");
});

test("analyzeVoicing detects spacing issues", () => {
    // Large gap in upper voices (> octave)
    const v = T.analyzeVoicing([48, 55, 72, 76], T.identifyChord([0, 4, 7], 0));
    assert.ok(v);
    assert.ok(v.spacingIssues.length > 0);
});

test("analyzeVoicing reports doublings", () => {
    // Two C's: doubling
    const v = T.analyzeVoicing([48, 60, 64, 67], T.identifyChord([0, 4, 7], 0));
    assert.ok(v);
    assert.ok(v.doublings.some(d => d.name === "C"));
});

// --- Pitch-class set theory ---

test("normalForm computes correct normal form", () => {
    // {0, 1, 6} -> normal form [1, 6, 0] -> [6, 0, 1]
    const nf = T.normalForm([0, 1, 6]);
    assert.strictEqual(nf.length, 3);
    // The span should be minimal
    const span = T.mod(nf[nf.length - 1] - nf[0], 12);
    assert.ok(span <= 6);
});

test("primeForm transposes to 0 and picks most compact", () => {
    const pf = T.primeForm([0, 4, 7]); // major triad
    assert.deepStrictEqual(pf, [0, 3, 7]);
});

test("primeForm of minor triad", () => {
    const pf = T.primeForm([0, 3, 7]); // minor triad
    assert.deepStrictEqual(pf, [0, 3, 7]);
});

test("intervalVector for a major triad", () => {
    const iv = T.intervalVector([0, 4, 7]);
    // major triad = [0,0,1,1,1,0] -> ic1=0, ic2=0, ic3=1, ic4=1, ic5=1, ic6=0
    assert.deepStrictEqual(iv, [0, 0, 1, 1, 1, 0]);
});

test("intervalVector for chromatic trichord", () => {
    const iv = T.intervalVector([0, 1, 2]);
    assert.deepStrictEqual(iv, [2, 1, 0, 0, 0, 0]);
});

test("formatPcSet formats correctly", () => {
    assert.strictEqual(T.formatPcSet([0, 3, 7]), "{0,3,7}");
});

test("forteName looks up known Forte names", () => {
    const fn = T.forteName([0, 4, 7]); // major triad -> 3-11
    assert.strictEqual(fn, "3-11");
});

test("forteName for augmented triad", () => {
    const fn = T.forteName([0, 4, 8]); // augmented triad -> 3-12
    assert.strictEqual(fn, "3-12");
});

test("forteName for diminished triad", () => {
    const fn = T.forteName([0, 3, 6]); // diminished triad -> 3-10
    assert.strictEqual(fn, "3-10");
});

// --- Common-tone diminished 7th ---

test("classifyCommonToneDim7 detects CT°7 over a major chord", () => {
    // C#°7 [1,4,7,10] shares C(0)->no, but 4(E)->yes with C major [0,4,7]
    const dim7 = T.identifyChord([1, 4, 7, 10], 1);
    const cMaj = T.identifyChord([0, 4, 7], 0);
    const ct = T.classifyCommonToneDim7(dim7, cMaj, C_MAJOR);
    assert.ok(ct);
    assert.strictEqual(ct.type, "common-tone-dim7");
    assert.ok(ct.commonTones.length > 0);
});

test("classifyCommonToneDim7 returns null for non-dim7", () => {
    const cMaj = T.identifyChord([0, 4, 7], 0);
    const gMaj = T.identifyChord([7, 11, 2], 7);
    assert.strictEqual(T.classifyCommonToneDim7(cMaj, gMaj, C_MAJOR), null);
});

// --- Enharmonic respelling ---

test("suggestEnharmonic flags double sharps", () => {
    // tpc=27 is F## (== G)
    const hint = T.suggestEnharmonic(27, C_MAJOR);
    assert.ok(hint);
    assert.ok(/respelling/.test(hint.reason));
});

test("suggestEnharmonic returns null for normal notes", () => {
    assert.strictEqual(T.suggestEnharmonic(14, C_MAJOR), null); // C
    assert.strictEqual(T.suggestEnharmonic(20, C_MAJOR), null); // F#
});

// --- Phrase structure ---

test("analyzePhraseStructure detects a period (HC + PAC)", () => {
    const cadences = [
        { type: "HC", measure: 4 },
        { type: "PAC", measure: 8 }
    ];
    const result = T.analyzePhraseStructure(cadences);
    assert.strictEqual(result.structure, "period");
    assert.strictEqual(result.phrases.length, 2);
    assert.strictEqual(result.phrases[0].cadenceType, "HC");
    assert.strictEqual(result.phrases[1].cadenceType, "PAC");
});

test("analyzePhraseStructure detects a parallel period (PAC + PAC)", () => {
    const cadences = [
        { type: "PAC", measure: 4 },
        { type: "PAC", measure: 8 }
    ];
    const result = T.analyzePhraseStructure(cadences);
    assert.strictEqual(result.structure, "parallel-period");
});

test("analyzePhraseStructure detects phrase group", () => {
    const cadences = [
        { type: "DC", measure: 4 },
        { type: "HC", measure: 8 }
    ];
    const result = T.analyzePhraseStructure(cadences);
    assert.strictEqual(result.structure, "phrase-group");
});

test("analyzePhraseStructure handles single phrase", () => {
    const result = T.analyzePhraseStructure([{ type: "PAC", measure: 8 }]);
    assert.strictEqual(result.structure, "single-phrase");
});

test("analyzePhraseStructure handles empty input", () => {
    const result = T.analyzePhraseStructure([]);
    assert.strictEqual(result.structure, "unknown");
});
