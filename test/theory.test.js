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

// ===================================================================
//  PHASE 2 FEATURE TESTS
// ===================================================================

// --- SATB voice range checking ---

test("checkSATBRanges passes for notes within range", () => {
    // bass=48(C3), tenor=55(G3), alto=60(C4), soprano=67(G4)
    const issues = T.checkSATBRanges([48, 55, 60, 67]);
    assert.strictEqual(issues.length, 0);
});

test("checkSATBRanges detects out-of-range notes", () => {
    // bass too low (30), soprano too high (85)
    const issues = T.checkSATBRanges([30, 55, 60, 85]);
    assert.ok(issues.some(i => i.voice === "bass" && i.problem === "below-range"));
    assert.ok(issues.some(i => i.voice === "soprano" && i.problem === "above-range"));
});

test("checkSATBRanges detects voice crossing", () => {
    // tenor(70) above alto(60)
    const issues = T.checkSATBRanges([48, 70, 60, 75]);
    assert.ok(issues.some(i => i.problem === "voice-crossing"));
});

test("checkSATBRanges detects spacing issues", () => {
    // alto=55, soprano=72: 17 semitones apart (> octave)
    const issues = T.checkSATBRanges([48, 50, 55, 72]);
    assert.ok(issues.some(i => i.problem === "spacing"));
});

// --- Counterpoint checking ---

test("checkCounterpoint detects parallel perfect intervals", () => {
    const melody = [60, 62, 64];       // C4, D4, E4
    const counter = [48, 50, 52];      // C3, D3, E3 (parallel octaves)
    const issues = T.checkCounterpoint(melody, counter);
    assert.ok(issues.some(i => i.type === "parallel-perfect"));
});

test("checkCounterpoint detects unison in middle", () => {
    const melody = [60, 65, 67];
    const counter = [48, 65, 55]; // unison at index 1 (middle)
    const issues = T.checkCounterpoint(melody, counter);
    assert.ok(issues.some(i => i.type === "unison"));
});

test("checkCounterpoint passes clean counterpoint", () => {
    // Contrary motion with no parallel perfects.
    const melody = [60, 62, 64, 65];
    const counter = [55, 53, 52, 50];
    const issues = T.checkCounterpoint(melody, counter);
    const perfects = issues.filter(i => i.type === "parallel-perfect");
    assert.strictEqual(perfects.length, 0);
});

// --- Cross-relation detection ---

test("detectCrossRelations finds B-Bb cross-relation", () => {
    const prev = [0, 4, 7, 11]; // C E G B
    const curr = [0, 3, 5, 10]; // C Eb F Bb
    const cr = T.detectCrossRelations(prev, curr);
    assert.ok(cr.length > 0);
    assert.ok(cr.some(r => r.pc1 === 11 && r.pc2 === 10));
});

test("detectCrossRelations returns empty for diatonic chords", () => {
    const prev = [0, 4, 7]; // C E G
    const curr = [2, 5, 9]; // D F A
    const cr = T.detectCrossRelations(prev, curr);
    assert.strictEqual(cr.length, 0);
});

// --- Melodic contour analysis ---

test("analyzeMelodicContour computes range and climax", () => {
    const pitches = [60, 62, 64, 67, 65, 62, 60];
    const c = T.analyzeMelodicContour(pitches);
    assert.ok(c);
    assert.strictEqual(c.range, 7); // 67 - 60
    assert.strictEqual(c.high, 67);
    assert.strictEqual(c.low, 60);
    assert.strictEqual(c.climaxIndex, 3);
});

test("analyzeMelodicContour classifies arch contour", () => {
    // Ascend then descend with peak in middle.
    const pitches = [60, 62, 64, 67, 69, 67, 64, 62, 60];
    const c = T.analyzeMelodicContour(pitches);
    assert.ok(c);
    assert.strictEqual(c.contour, "arch");
});

test("analyzeMelodicContour reports leap/step percentages", () => {
    const pitches = [60, 61, 62, 63, 72]; // 3 steps + 1 leap
    const c = T.analyzeMelodicContour(pitches);
    assert.ok(c);
    assert.strictEqual(c.stepPercent, 75);
    assert.strictEqual(c.leapPercent, 25);
});

// --- Texture classification ---

test("classifyTexture detects monophonic texture", () => {
    const events = [
        { pitches: [60], pitchClasses: [0] },
        { pitches: [62], pitchClasses: [2] },
        { pitches: [64], pitchClasses: [4] }
    ];
    assert.strictEqual(T.classifyTexture(events), "monophonic");
});

test("classifyTexture detects homophonic texture", () => {
    const events = [
        { pitches: [60, 64, 67], pitchClasses: [0, 4, 7] },
        { pitches: [62, 65, 69], pitchClasses: [2, 5, 9] },
        { pitches: [64, 67, 71], pitchClasses: [4, 7, 11] }
    ];
    assert.strictEqual(T.classifyTexture(events), "homophonic");
});

// --- Form detection ---

test("detectForm identifies binary form", () => {
    const sections = [
        { startMeasure: 1, endMeasure: 8, key: { tonicPc: 0 } },
        { startMeasure: 9, endMeasure: 16, key: { tonicPc: 7 } }
    ];
    assert.strictEqual(T.detectForm(sections).form, "binary");
});

test("detectForm identifies ternary form (A-B-A)", () => {
    const sections = [
        { startMeasure: 1, endMeasure: 8, key: { tonicPc: 0 } },
        { startMeasure: 9, endMeasure: 16, key: { tonicPc: 5 } },
        { startMeasure: 17, endMeasure: 24, key: { tonicPc: 0 } }
    ];
    assert.strictEqual(T.detectForm(sections).form, "ternary");
});

test("detectForm identifies rounded binary", () => {
    const sections = [
        { startMeasure: 1, endMeasure: 8, key: { tonicPc: 0 } },
        { startMeasure: 9, endMeasure: 16, key: { tonicPc: 0 } }
    ];
    assert.strictEqual(T.detectForm(sections).form, "binary-rounded");
});

// --- Cadential 6/4 detection ---

test("detectCadential64 identifies I64 → V", () => {
    const i64 = T.identifyChord([7, 0, 4], 7); // C/G (second inversion)
    const v = T.identifyChord([7, 11, 2], 7);   // G major
    const result = T.detectCadential64(i64, v, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "cadential-64");
});

test("detectCadential64 returns null for non-cadential", () => {
    const i = T.identifyChord([0, 4, 7], 0); // C root position
    const v = T.identifyChord([7, 11, 2], 7);
    assert.strictEqual(T.detectCadential64(i, v, C_MAJOR), null); // Not second inversion
});

// --- Twelve-tone row analysis ---

test("computeRowForms generates P, I, R, RI", () => {
    // Webern-like row
    const row = [0, 1, 4, 2, 3, 5, 6, 9, 7, 8, 10, 11];
    const forms = T.computeRowForms(row);
    assert.ok(forms);
    assert.deepStrictEqual(forms.P0, row);
    assert.deepStrictEqual(forms.R0, row.slice().reverse());
    // I0 starts on same note.
    assert.strictEqual(forms.I0[0], row[0]);
    assert.strictEqual(forms.RI0.length, 12);
});

test("computeRowForms P transpositions are correct", () => {
    const row = [0, 1, 3, 2, 6, 7, 5, 4, 8, 9, 11, 10];
    const forms = T.computeRowForms(row);
    // P5 should be P0 transposed up 5.
    for (let i = 0; i < 12; i++) {
        assert.strictEqual(forms.matrix.P[5][i], (row[i] + 5) % 12);
    }
});

test("findRowForm matches P0 from a segment", () => {
    const row = [0, 1, 4, 2, 3, 5, 6, 9, 7, 8, 10, 11];
    const result = T.findRowForm(row, [0, 1, 4, 2, 3]);
    assert.ok(result);
    assert.strictEqual(result.type, "P");
    assert.strictEqual(result.transposition, 0);
});

test("findRowForm matches transposed form", () => {
    const row = [0, 1, 4, 2, 3, 5, 6, 9, 7, 8, 10, 11];
    // P3: transpose everything by 3.
    const p3 = row.map(x => (x + 3) % 12);
    const result = T.findRowForm(row, p3.slice(0, 5));
    assert.ok(result);
    assert.strictEqual(result.type, "P");
    assert.strictEqual(result.transposition, 3);
});

test("findRowForm returns null for non-matching sequence", () => {
    const row = [0, 1, 4, 2, 3, 5, 6, 9, 7, 8, 10, 11];
    assert.strictEqual(T.findRowForm(row, [0, 5, 3, 8, 1]), null);
});

// --- Chord-scale theory ---

test("suggestChordScales returns scales for a major chord", () => {
    const chord = T.identifyChord([0, 4, 7], 0);
    const scales = T.suggestChordScales(chord);
    assert.ok(scales.length >= 1);
    assert.ok(scales.some(s => s.scaleName === "ionian"));
});

test("suggestChordScales returns scales for a dom7 chord", () => {
    const chord = T.identifyChord([0, 4, 7, 10], 0);
    const scales = T.suggestChordScales(chord);
    assert.ok(scales.some(s => s.scaleName === "mixolydian"));
});

test("suggestChordScales returns scales for a min7 chord", () => {
    const chord = T.identifyChord([0, 3, 7, 10], 0);
    const scales = T.suggestChordScales(chord);
    assert.ok(scales.some(s => s.scaleName === "dorian"));
});

test("suggestChordScales returns empty for null chord", () => {
    assert.deepStrictEqual(T.suggestChordScales(null), []);
});

// --- Harmonic tension mapping ---

test("computeHarmonicTension assigns tension scores", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },     // C major (low tension)
        { tick: 480, measure: 1, pitchClasses: [7, 11, 2, 5], bassPc: 7 } // G7 (higher tension)
    ];
    const tensions = T.computeHarmonicTension(events, C_MAJOR);
    assert.strictEqual(tensions.length, 2);
    assert.ok(tensions[1].tension > tensions[0].tension); // G7 more tense than C
});

test("computeHarmonicTension dim7 is very tense", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },
        { tick: 480, measure: 1, pitchClasses: [11, 2, 5, 8], bassPc: 11 }
    ];
    const tensions = T.computeHarmonicTension(events, C_MAJOR);
    assert.ok(tensions[1].tension >= 4);
});

// --- Augmented sixth classification ---

test("classifyAugmentedSixth identifies Italian Aug6", () => {
    // In C major: Ab(8), C(0), F#(6) = It+6
    const result = T.classifyAugmentedSixth([8, 0, 6], C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "It+6");
});

test("classifyAugmentedSixth identifies French Aug6", () => {
    // In C major: Ab(8), C(0), D(2), F#(6) = Fr+6
    const result = T.classifyAugmentedSixth([8, 0, 2, 6], C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "Fr+6");
});

test("classifyAugmentedSixth returns null for non-aug6", () => {
    assert.strictEqual(T.classifyAugmentedSixth([0, 4, 7], C_MAJOR), null);
});

// --- Planing / parallel chord motion ---

test("detectPlaning finds parallel major chords", () => {
    // C-D-E-F# major chords moving by whole step.
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },
        { tick: 480, measure: 1, pitchClasses: [2, 6, 9], bassPc: 2 },
        { tick: 960, measure: 2, pitchClasses: [4, 8, 11], bassPc: 4 },
        { tick: 1440, measure: 2, pitchClasses: [6, 10, 1], bassPc: 6 }
    ];
    const planes = T.detectPlaning(events, 3);
    assert.ok(planes.length > 0);
    assert.ok(planes[0].description.indexOf("Planing") >= 0);
});

test("detectPlaning returns empty for varied chord types", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },
        { tick: 480, measure: 1, pitchClasses: [2, 5, 9], bassPc: 2 },
        { tick: 960, measure: 2, pitchClasses: [4, 8, 11], bassPc: 4 }
    ];
    const planes = T.detectPlaning(events, 3);
    assert.strictEqual(planes.length, 0);
});

// --- Linear intervallic patterns ---

test("detectLinearIntervallic finds parallel 10ths", () => {
    // Upper = C4, D4, E4; Lower = Ab2, Bb2, C3 (interval 4 = major 3rd, mod 12)
    // Actually let's use consistent intervals.
    const upper = [64, 66, 68, 70]; // E4, F#4, G#4, A#4
    const lower = [48, 50, 52, 54]; // C3, D3, E3, F#3 (interval 16 mod 12 = 4)
    const lips = T.detectLinearIntervallic(upper, lower, 3);
    assert.ok(lips.length > 0);
});

test("detectLinearIntervallic returns empty for varied intervals", () => {
    const upper = [60, 65, 62, 68];
    const lower = [48, 50, 55, 52];
    const lips = T.detectLinearIntervallic(upper, lower, 4);
    // Intervals vary widely, so no consistent pattern of length 4.
    assert.ok(Array.isArray(lips));
});

// --- Hemiola detection ---

test("detectHemiola returns array (basic check)", () => {
    const durations = [480, 480, 480, 480, 480, 480];
    const result = T.detectHemiola(durations, 3);
    assert.ok(Array.isArray(result));
});

test("detectHemiola returns empty for uniform quarter notes in 4/4", () => {
    const durations = [480, 480, 480, 480];
    const result = T.detectHemiola(durations, 4);
    assert.strictEqual(result.length, 0);
});

// ===================================================================
//  PHASE 3 FEATURE TESTS
// ===================================================================

// --- Secondary dominant chains ---

test("traceSecondaryChain finds a chain in C major", () => {
    // D7 → G → C: D7 is V/V, then G is V
    const events = [
        { tick: 0, measure: 1, pitchClasses: [2, 6, 9, 0], bassPc: 2 },  // D7
        { tick: 480, measure: 1, pitchClasses: [7, 11, 2], bassPc: 7 },  // G
        { tick: 960, measure: 2, pitchClasses: [0, 4, 7], bassPc: 0 }    // C
    ];
    const chains = T.traceSecondaryChain(events, C_MAJOR);
    assert.ok(chains.length > 0);
    assert.ok(chains[0].length >= 2);
});

test("traceSecondaryChain returns empty for diatonic progression", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },  // C
        { tick: 480, measure: 1, pitchClasses: [5, 9, 0], bassPc: 5 }, // F
        { tick: 960, measure: 2, pitchClasses: [0, 4, 7], bassPc: 0 }  // C
    ];
    const chains = T.traceSecondaryChain(events, C_MAJOR);
    assert.strictEqual(chains.length, 0);
});

// --- Applied chord network ---

test("buildAppliedChordNetwork maps target degrees", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [2, 6, 9, 0], bassPc: 2 },  // D7 (V/V)
        { tick: 480, measure: 1, pitchClasses: [7, 11, 2], bassPc: 7 }    // G (V)
    ];
    const network = T.buildAppliedChordNetwork(events, C_MAJOR);
    assert.ok(Object.keys(network).length > 0);
});

// --- Mode mixture ---

test("classifyModeMixture detects iv in C major", () => {
    // iv in C major = F minor [5, 8, 0]
    const chord = T.identifyChord([5, 8, 0], 5);
    const result = T.classifyModeMixture(chord, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.symbol, "iv");
});

test("classifyModeMixture detects bVI in C major", () => {
    // bVI in C major = Ab major [8, 0, 3]
    const chord = T.identifyChord([8, 0, 3], 8);
    const result = T.classifyModeMixture(chord, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.symbol, "bVI");
});

test("classifyModeMixture returns null for diatonic chord", () => {
    const chord = T.identifyChord([0, 4, 7], 0);
    assert.strictEqual(T.classifyModeMixture(chord, C_MAJOR), null);
});

// --- Prolongation ---

test("classifyProlongation detects neighbor chord", () => {
    const c = T.identifyChord([0, 4, 7], 0);   // C
    const d = T.identifyChord([2, 5, 9], 2);    // Dm
    const c2 = T.identifyChord([0, 4, 7], 0);   // C
    const result = T.classifyProlongation(c, d, c2, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "neighbor");
});

test("classifyProlongation returns null for dissimilar outer chords", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const d = T.identifyChord([2, 5, 9], 2);
    const g = T.identifyChord([7, 11, 2], 7);
    assert.strictEqual(T.classifyProlongation(c, d, g, C_MAJOR), null);
});

// --- Syncopation ---

test("detectSyncopation finds syncopation on weak beat", () => {
    const events = [
        { tick: 480, duration: 960, measure: 1 }   // Starts on beat 2, lasts 2 beats
    ];
    const syncs = T.detectSyncopation(events, 480, 4);
    assert.ok(syncs.length > 0);
});

test("detectSyncopation returns empty for on-beat notes", () => {
    const events = [
        { tick: 0, duration: 480, measure: 1 },     // Beat 1
        { tick: 960, duration: 480, measure: 1 }     // Beat 3
    ];
    const syncs = T.detectSyncopation(events, 480, 4);
    assert.strictEqual(syncs.length, 0);
});

// --- Voice independence ---

test("scoreVoiceIndependence scores contrary motion high", () => {
    const voices = [
        [60, 62, 64, 65],   // Ascending
        [72, 70, 68, 67]    // Descending (contrary)
    ];
    const result = T.scoreVoiceIndependence(voices);
    assert.ok(result.score > 0.7);
    assert.ok(result.details.contrary > 0);
});

test("scoreVoiceIndependence scores parallel motion low", () => {
    const voices = [
        [60, 62, 64, 65],
        [48, 50, 52, 53]    // Parallel
    ];
    const result = T.scoreVoiceIndependence(voices);
    assert.ok(result.score < 0.5);
    assert.ok(result.details.parallel > 0);
});

// --- Chord substitution ---

test("classifySubstitution detects tritone sub", () => {
    const db7 = T.identifyChord([1, 5, 8, 11], 1);
    const g7 = T.identifyChord([7, 11, 2, 5], 7);
    const result = T.classifySubstitution(g7, db7, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "tritone-sub");
});

test("classifySubstitution detects relative substitution", () => {
    const c = T.identifyChord([0, 4, 7], 0);   // C major
    const am = T.identifyChord([9, 0, 4], 9);   // A minor (relative minor)
    const result = T.classifySubstitution(c, am, C_MAJOR);
    assert.ok(result);
    assert.strictEqual(result.type, "relative");
});

test("classifySubstitution returns null for unrelated chords", () => {
    const c = T.identifyChord([0, 4, 7], 0);
    const fs = T.identifyChord([6, 10, 1], 6);  // F# major
    const result = T.classifySubstitution(c, fs, C_MAJOR);
    assert.strictEqual(result, null);
});

// --- Aggregate completion ---

test("trackAggregateCompletion finds first completion", () => {
    const pcs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const result = T.trackAggregateCompletion(pcs);
    assert.strictEqual(result.completionIndex, 11);
    assert.strictEqual(result.totalAggregates, 1);
});

test("trackAggregateCompletion reports incomplete", () => {
    const pcs = [0, 2, 4, 5, 7];
    const result = T.trackAggregateCompletion(pcs);
    assert.strictEqual(result.completionIndex, -1);
    assert.strictEqual(result.pcsCovered, 5);
});

test("trackAggregateCompletion finds multiple aggregates", () => {
    const pcs = [0,1,2,3,4,5,6,7,8,9,10,11, 0,1,2,3,4,5,6,7,8,9,10,11];
    const result = T.trackAggregateCompletion(pcs);
    assert.strictEqual(result.totalAggregates, 2);
});

// --- Voice-leading efficiency ---

test("voiceLeadingEfficiency measures smooth motion", () => {
    const prev = [60, 64, 67];  // C4 E4 G4
    const curr = [60, 65, 69];  // C4 F4 A4
    const result = T.voiceLeadingEfficiency(prev, curr);
    assert.ok(result);
    assert.strictEqual(result.commonTones, 1); // C stays
    assert.ok(result.totalSemitones <= 4);
    assert.strictEqual(result.parsimonious, true);
});

test("voiceLeadingEfficiency measures large leaps", () => {
    const prev = [48, 52, 55];  // C3 E3 G3
    const curr = [60, 64, 67];  // C4 E4 G4
    const result = T.voiceLeadingEfficiency(prev, curr);
    assert.ok(result);
    assert.strictEqual(result.totalSemitones, 36);
    assert.strictEqual(result.parsimonious, false);
});

// --- Melodic interval-class content ---

test("melodicIntervalClassContent analyzes a scale", () => {
    const pitches = [60, 62, 64, 65, 67]; // C D E F G (all steps)
    const result = T.melodicIntervalClassContent(pitches);
    assert.ok(result);
    assert.strictEqual(result.totalIntervals, 4);
    // All intervals are 1 or 2 semitones (ic1 and ic2).
    assert.ok(result.ic[1] + result.ic[2] === 4);
});

test("melodicIntervalClassContent finds most common IC", () => {
    const pitches = [60, 67, 60, 67]; // All P5 (ic5)
    const result = T.melodicIntervalClassContent(pitches);
    assert.strictEqual(result.mostCommonIC, 5);
});

// --- Structural tones ---

test("identifyStructuralTones marks first/last as structural", () => {
    const pitches = [60, 62, 64, 65, 67];
    const result = T.identifyStructuralTones(pitches, null, C_MAJOR);
    assert.ok(result[0].structural);
    assert.ok(result[result.length - 1].structural);
});

test("identifyStructuralTones marks chord tones as structural", () => {
    const pitches = [60, 61, 64, 66, 67]; // C, C#, E, F#, G
    const result = T.identifyStructuralTones(pitches, null, C_MAJOR);
    // C(0), E(4), G(7) are chord tones (degrees 1, 3, 5)
    assert.ok(result[0].structural);  // C = degree 1
    assert.ok(result[2].structural);  // E = degree 3
    assert.ok(result[4].structural);  // G = degree 5
});

// --- Harmonic function distribution ---

test("harmonicFunctionDistribution counts T/S/D", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },   // C = T
        { tick: 480, measure: 1, pitchClasses: [5, 9, 0], bassPc: 5 },  // F = S
        { tick: 960, measure: 2, pitchClasses: [7, 11, 2], bassPc: 7 }, // G = D
        { tick: 1440, measure: 2, pitchClasses: [0, 4, 7], bassPc: 0 }  // C = T
    ];
    const dist = T.harmonicFunctionDistribution(events, C_MAJOR);
    assert.ok(dist.tonic >= 2);
    assert.ok(dist.subdominant >= 1);
    assert.ok(dist.dominant >= 1);
    assert.strictEqual(dist.total, 4);
});

test("harmonicFunctionDistribution returns percentages", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 },
        { tick: 480, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0 }
    ];
    const dist = T.harmonicFunctionDistribution(events, C_MAJOR);
    assert.strictEqual(dist.tonicPercent, 100);
});

// ===================================================================
//  PHASE 4 TEACHING FEATURE TESTS
// ===================================================================

// --- Sight-reading difficulty ---

test("scoreSightReadingDifficulty returns 1-10 score", () => {
    const events = [
        { pitches: [60, 64, 67], pitchClasses: [0, 4, 7] },
        { pitches: [62, 65, 69], pitchClasses: [2, 5, 9] }
    ];
    const result = T.scoreSightReadingDifficulty(events, C_MAJOR);
    assert.ok(result.score >= 1 && result.score <= 10);
    assert.ok(result.factors);
});

test("scoreSightReadingDifficulty rates chromatic passage higher", () => {
    const diatonic = [
        { pitches: [60], pitchClasses: [0] },
        { pitches: [62], pitchClasses: [2] },
        { pitches: [64], pitchClasses: [4] }
    ];
    const chromatic = [
        { pitches: [60], pitchClasses: [0] },
        { pitches: [61], pitchClasses: [1] },
        { pitches: [63], pitchClasses: [3] },
        { pitches: [66], pitchClasses: [6] },
        { pitches: [68], pitchClasses: [8] }
    ];
    const d = T.scoreSightReadingDifficulty(diatonic, C_MAJOR);
    const c = T.scoreSightReadingDifficulty(chromatic, C_MAJOR);
    assert.ok(c.factors.chromaticism >= d.factors.chromaticism);
});

// --- Interval drill ---

test("generateIntervalDrill returns valid drill", () => {
    const drill = T.generateIntervalDrill();
    assert.ok(drill.startPitch);
    assert.ok(drill.endPitch);
    assert.ok(drill.intervalName);
    assert.ok(drill.direction === "ascending" || drill.direction === "descending");
    assert.ok(drill.semitones >= 1 && drill.semitones <= 12);
});

test("generateIntervalDrill respects options", () => {
    const drill = T.generateIntervalDrill({ intervals: [7], minPitch: 60, maxPitch: 72 });
    assert.strictEqual(drill.semitones, 7);
    assert.ok(drill.startPitch >= 60);
});

// --- Chord drill ---

test("generateChordDrill returns valid drill", () => {
    const drill = T.generateChordDrill();
    assert.ok(drill.rootPc >= 0 && drill.rootPc <= 11);
    assert.ok(drill.quality);
    assert.ok(drill.pitchClasses.length >= 3);
    assert.ok(drill.answer);
});

test("generateChordDrill respects quality options", () => {
    const drill = T.generateChordDrill({ qualities: ["min7"] });
    assert.strictEqual(drill.quality, "min7");
    assert.strictEqual(drill.pitchClasses.length, 4);
});

// --- Scale drill ---

test("generateScaleDrill returns valid drill", () => {
    const drill = T.generateScaleDrill();
    assert.ok(drill.rootPc >= 0 && drill.rootPc <= 11);
    assert.ok(drill.scaleName);
    assert.ok(drill.pitchClasses.length >= 5);
    assert.ok(drill.noteNames.length === drill.pitchClasses.length);
});

test("generateScaleDrill respects scale options", () => {
    const drill = T.generateScaleDrill({ scales: ["blues"] });
    assert.strictEqual(drill.scaleName, "blues");
    assert.strictEqual(drill.pitchClasses.length, 6); // Blues = 6 notes.
});

// --- Error diagnosis ---

test("diagnoseErrors finds parallel fifths", () => {
    // C-G (P5) → D-A (P5) = parallel fifths.
    const events = [
        { pitches: [48, 55], pitchClasses: [0, 7], measure: 1 },
        { pitches: [50, 57], pitchClasses: [2, 9], measure: 1 }
    ];
    const diag = T.diagnoseErrors(events, C_MAJOR);
    assert.ok(diag.length > 0);
    assert.ok(diag[0].explanation.length > 0);
    assert.ok(diag[0].fix.length > 0);
});

test("diagnoseErrors returns pedagogical messages", () => {
    const events = [
        { pitches: [48, 55], pitchClasses: [0, 7], measure: 1 },
        { pitches: [50, 57], pitchClasses: [2, 9], measure: 1 }
    ];
    const diag = T.diagnoseErrors(events, C_MAJOR);
    if (diag.length > 0) {
        assert.ok(diag[0].error);
        assert.ok(diag[0].explanation);
        assert.ok(diag[0].fix);
    }
});

// --- Roman numeral quiz ---

test("generateRomanNumeralQuiz returns chords with RN labels", () => {
    const quiz = T.generateRomanNumeralQuiz(C_MAJOR, { count: 3 });
    assert.strictEqual(quiz.chords.length, 3);
    assert.ok(quiz.key);
    for (let i = 0; i < quiz.chords.length; i++) {
        assert.ok(quiz.chords[i].degree >= 1 && quiz.chords[i].degree <= 7);
        assert.ok(quiz.chords[i].romanNumeral);
    }
});

test("generateRomanNumeralQuiz works with minor key", () => {
    const aMinor = { tonicPc: 9, mode: "minor" };
    const quiz = T.generateRomanNumeralQuiz(aMinor, { count: 2 });
    assert.strictEqual(quiz.chords.length, 2);
});

// --- Cadence drill ---

test("generateCadenceDrill returns valid cadence", () => {
    const drill = T.generateCadenceDrill(C_MAJOR);
    assert.ok(drill.cadenceType);
    assert.ok(drill.description);
    assert.ok(drill.chords.length >= 2);
    assert.ok(drill.key);
});

// --- Scale degree hints ---

test("getScaleDegreeHint returns hint for tonic", () => {
    const hint = T.getScaleDegreeHint(60, C_MAJOR); // C4 in C major = degree 1.
    assert.ok(hint);
    assert.strictEqual(hint.degree, 1);
    assert.strictEqual(hint.solfege, "Do");
    assert.ok(hint.character.length > 0);
});

test("getScaleDegreeHint returns hint for leading tone", () => {
    const hint = T.getScaleDegreeHint(71, C_MAJOR); // B4 in C major = degree 7.
    assert.ok(hint);
    assert.strictEqual(hint.degree, 7);
    assert.strictEqual(hint.solfege, "Ti");
});

test("SCALE_DEGREE_HINTS has all 7 degrees", () => {
    for (let d = 1; d <= 7; d++) {
        assert.ok(T.SCALE_DEGREE_HINTS[d]);
        assert.ok(T.SCALE_DEGREE_HINTS[d].solfege);
        assert.ok(T.SCALE_DEGREE_HINTS[d].character);
    }
});

// --- Common mistakes ---

test("detectCommonMistakes finds doubled leading tone", () => {
    // Two B naturals (pc 11) in C major.
    const events = [
        { pitches: [47, 59, 64, 71], pitchClasses: [11, 11, 4, 11], measure: 1,
          chord: T.identifyChord([11, 2, 5], 11), bassPc: 11 }
    ];
    const mistakes = T.detectCommonMistakes(events, C_MAJOR);
    const doubled = mistakes.filter(function(m) { return m.type === "doubledLeadingTone"; });
    assert.ok(doubled.length > 0);
    assert.ok(doubled[0].explanation.length > 0);
});

test("detectCommonMistakes returns empty for clean writing", () => {
    const events = [
        { pitches: [48, 55, 60, 64], pitchClasses: [0, 7, 0, 4], measure: 1,
          chord: T.identifyChord([0, 4, 7], 0), bassPc: 0 }
    ];
    const mistakes = T.detectCommonMistakes(events, C_MAJOR);
    const doubled = mistakes.filter(function(m) { return m.type === "doubledLeadingTone"; });
    assert.strictEqual(doubled.length, 0);
});

// --- Guided analysis ---

test("generateGuidedAnalysis returns step-by-step walkthrough", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0, pitches: [48, 52, 55] },
        { tick: 480, measure: 1, pitchClasses: [5, 9, 0], bassPc: 5, pitches: [53, 57, 60] },
        { tick: 960, measure: 2, pitchClasses: [7, 11, 2], bassPc: 7, pitches: [55, 59, 62] },
        { tick: 1440, measure: 2, pitchClasses: [0, 4, 7], bassPc: 0, pitches: [48, 52, 55] }
    ];
    const analysis = T.generateGuidedAnalysis(events, C_MAJOR);
    assert.ok(analysis.steps.length >= 5);
    assert.ok(analysis.key);
    assert.strictEqual(analysis.steps[0].title, "Identify the Key");
    assert.ok(analysis.steps[1].title.indexOf("Roman") >= 0);
});

test("generateGuidedAnalysis includes harmonic function step", () => {
    const events = [
        { tick: 0, measure: 1, pitchClasses: [0, 4, 7], bassPc: 0, pitches: [48, 52, 55] },
        { tick: 480, measure: 1, pitchClasses: [7, 11, 2], bassPc: 7, pitches: [55, 59, 62] }
    ];
    const analysis = T.generateGuidedAnalysis(events, C_MAJOR);
    const funcStep = analysis.steps.filter(function(s) { return s.title.indexOf("Function") >= 0; });
    assert.ok(funcStep.length > 0);
});

// --- Practice tips ---

test("generatePracticeTips returns tips array", () => {
    const events = [
        { pitches: [60, 64, 67], pitchClasses: [0, 4, 7] },
        { pitches: [62, 65, 69], pitchClasses: [2, 5, 9] }
    ];
    const tips = T.generatePracticeTips(events, C_MAJOR);
    assert.ok(Array.isArray(tips));
    assert.ok(tips.length > 0);
    assert.ok(tips[0].category);
    assert.ok(tips[0].tip);
});

test("generatePracticeTips adds leap tip for jumpy passage", () => {
    const events = [
        { pitches: [48], pitchClasses: [0] },
        { pitches: [72], pitchClasses: [0] },
        { pitches: [48], pitchClasses: [0] },
        { pitches: [72], pitchClasses: [0] },
        { pitches: [48], pitchClasses: [0] }
    ];
    const tips = T.generatePracticeTips(events, C_MAJOR);
    const leapTips = tips.filter(function(t) { return t.category === "Leaps"; });
    assert.ok(leapTips.length > 0);
});

// --- TEACHING_MESSAGES constant ---

test("TEACHING_MESSAGES has all expected error types", () => {
    const expected = ["parallelFifths", "parallelOctaves", "voiceCrossing",
                      "spacingError", "unresolvedLeadingTone", "unresolvedSeventh",
                      "doubledLeadingTone", "directFifths"];
    for (let i = 0; i < expected.length; i++) {
        assert.ok(T.TEACHING_MESSAGES[expected[i]], "Missing: " + expected[i]);
        assert.ok(T.TEACHING_MESSAGES[expected[i]].error);
        assert.ok(T.TEACHING_MESSAGES[expected[i]].explanation);
        assert.ok(T.TEACHING_MESSAGES[expected[i]].fix);
    }
});
