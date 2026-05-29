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
