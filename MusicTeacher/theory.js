// =============================================================================
//  MusicTeacher - theory.js
//  Framework-free music-theory engine shared by the MuseScore plugins.
//
//  This file is written in plain ES5 so it runs unchanged both inside the
//  MuseScore QML JavaScript engine and under Node.js (for unit testing).
//  It must NOT reference any MuseScore globals - all score traversal lives in
//  mscore.js. Everything here is pure: data in, data out.
// =============================================================================

// ---------------------------------------------------------------------------
//  Pitch classes & spelling
// ---------------------------------------------------------------------------

// Pitch class names with sharps / flats (index 0 == C).
var PC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var PC_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Letters laid out on the circle of fifths, used to spell a tpc.
var TPC_STEPS = ["F", "C", "G", "D", "A", "E", "B"];

function mod(n, m) { return ((n % m) + m) % m; }

// MuseScore tonal pitch class (-1..33) -> pitch class 0..11 (C == 0).
// Each step around the circle of fifths is +7 semitones; tpc 14 == C.
function tpcToPc(tpc) {
    return mod((tpc - 14) * 7, 12);
}

// MuseScore tpc -> spelled note name, e.g. "C", "F#", "Bb", "Cbb".
function tpcToName(tpc) {
    var letter = TPC_STEPS[mod(tpc + 1, 7)];
    var alter = Math.floor((tpc + 1) / 7) - 2; // -2..+2
    var acc = "";
    var i;
    if (alter < 0) { for (i = 0; i < -alter; i++) acc += "b"; }
    else { for (i = 0; i < alter; i++) acc += "#"; }
    return letter + acc;
}

// Pitch class -> readable name. preferFlats picks the flat spelling.
function pcToName(pc, preferFlats) {
    pc = mod(pc, 12);
    return preferFlats ? PC_FLAT[pc] : PC_SHARP[pc];
}

// ---------------------------------------------------------------------------
//  Chord recognition
// ---------------------------------------------------------------------------

// Interval templates (semitones from the root). Order matters only for the
// "specificity" tie-break (longer templates win). Each entry carries a short
// label suffix and a simplified triad quality for relationship analysis.
var CHORD_TEMPLATES = [
    { quality: "maj",     intervals: [0, 4, 7],      symbol: "",    triad: "major" },
    { quality: "min",     intervals: [0, 3, 7],      symbol: "m",   triad: "minor" },
    { quality: "dim",     intervals: [0, 3, 6],      symbol: "\u00b0", triad: "diminished" },
    { quality: "aug",     intervals: [0, 4, 8],      symbol: "+",   triad: "augmented" },
    { quality: "sus4",    intervals: [0, 5, 7],      symbol: "sus4", triad: "sus" },
    { quality: "sus2",    intervals: [0, 2, 7],      symbol: "sus2", triad: "sus" },
    { quality: "7",       intervals: [0, 4, 7, 10],  symbol: "7",   triad: "major" },
    { quality: "maj7",    intervals: [0, 4, 7, 11],  symbol: "maj7", triad: "major" },
    { quality: "min7",    intervals: [0, 3, 7, 10],  symbol: "m7",  triad: "minor" },
    { quality: "m7b5",    intervals: [0, 3, 6, 10],  symbol: "\u00f87", triad: "diminished" },
    { quality: "dim7",    intervals: [0, 3, 6, 9],   symbol: "\u00b07", triad: "diminished" },
    { quality: "minMaj7", intervals: [0, 3, 7, 11],  symbol: "m(maj7)", triad: "minor" }
];

function uniqueSorted(arr) {
    var seen = {}, out = [], i;
    for (i = 0; i < arr.length; i++) {
        var v = mod(arr[i], 12);
        if (!seen[v]) { seen[v] = true; out.push(v); }
    }
    out.sort(function (a, b) { return a - b; });
    return out;
}

function contains(arr, v) {
    for (var i = 0; i < arr.length; i++) if (arr[i] === v) return true;
    return false;
}

// Identify the best chord for a collection of pitch classes.
// pitchClasses: array of pc (duplicates allowed). bassPc: optional lowest pc.
// Returns { rootPc, quality, symbol, triad, intervals, inversion, bassPc,
//           chordPcs, extras } or null when no triad/seventh is recognised.
function identifyChord(pitchClasses, bassPc) {
    var pcs = uniqueSorted(pitchClasses);
    if (pcs.length < 3) return null;

    var best = null;
    for (var r = 0; r < pcs.length; r++) {
        var root = pcs[r];
        var intervalsPresent = [];
        for (var i = 0; i < pcs.length; i++) intervalsPresent.push(mod(pcs[i] - root, 12));
        for (var t = 0; t < CHORD_TEMPLATES.length; t++) {
            var tmpl = CHORD_TEMPLATES[t];
            // Template must be fully contained in the sounding pitch classes.
            var ok = true;
            for (var k = 0; k < tmpl.intervals.length; k++) {
                if (!contains(intervalsPresent, tmpl.intervals[k])) { ok = false; break; }
            }
            if (!ok) continue;
            var extras = intervalsPresent.length - tmpl.intervals.length;
            // Prefer more specific templates (more chord tones), then fewer extras.
            var score = tmpl.intervals.length * 10 - extras;
            // Tie-break: for symmetric chords (e.g. dim7) favour the bass as root.
            if (typeof bassPc === "number" && root === mod(bassPc, 12)) score += 0.5;
            if (!best || score > best.score) {
                best = { score: score, root: root, tmpl: tmpl, extras: extras };
            }
        }
    }
    if (!best) return null;

    var chordPcs = [];
    for (var j = 0; j < best.tmpl.intervals.length; j++) {
        chordPcs.push(mod(best.root + best.tmpl.intervals[j], 12));
    }

    var inversion = 0;
    if (typeof bassPc === "number") {
        var bassInterval = mod(bassPc - best.root, 12);
        for (var p = 0; p < best.tmpl.intervals.length; p++) {
            if (best.tmpl.intervals[p] === bassInterval) { inversion = p; break; }
        }
    }

    return {
        rootPc: best.root,
        quality: best.tmpl.quality,
        symbol: best.tmpl.symbol,
        triad: best.tmpl.triad,
        intervals: best.tmpl.intervals,
        inversion: inversion,
        bassPc: (typeof bassPc === "number") ? mod(bassPc, 12) : best.root,
        chordPcs: chordPcs,
        extras: best.extras
    };
}

// Human-readable chord label: "C", "Am", "G7", "Bdim7".
function chordLabel(chord) {
    if (!chord) return "?";
    return pcToName(chord.rootPc, false) + chord.symbol;
}

// ---------------------------------------------------------------------------
//  Key detection (Krumhansl-Schmuckler)
// ---------------------------------------------------------------------------

var KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
var KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlate(hist, profile, tonic) {
    var s = 0;
    for (var i = 0; i < 12; i++) s += hist[mod(tonic + i, 12)] * profile[i];
    return s;
}

// Estimate the key from a 12-slot pitch-class duration histogram.
// keyHint (optional): either { tonicPc, mode } or { fifths: n } from the score
// key signature (n = sharps positive / flats negative). The matching key (and
// its relative) is lightly favoured. Returns { tonicPc, mode, confidence }.
function detectKey(pcHistogram, keyHint) {
    var hintTonic = null, hintMinor = null, hintMode = null;
    if (keyHint && typeof keyHint.fifths === "number") {
        hintTonic = mod(keyHint.fifths * 7, 12);   // major tonic for the signature
        hintMinor = mod(hintTonic - 3, 12);          // relative minor tonic
    } else if (keyHint && typeof keyHint.tonicPc === "number") {
        hintTonic = keyHint.tonicPc;
        hintMode = keyHint.mode;
    }

    var best = null, second = null;
    for (var tonic = 0; tonic < 12; tonic++) {
        var scores = [
            { mode: "major", s: correlate(pcHistogram, KS_MAJOR, tonic) },
            { mode: "minor", s: correlate(pcHistogram, KS_MINOR, tonic) }
        ];
        for (var m = 0; m < scores.length; m++) {
            var cand = { tonicPc: tonic, mode: scores[m].mode, s: scores[m].s };
            var matchesHint = (hintMode !== null)
                ? (tonic === hintTonic && scores[m].mode === hintMode)
                : (hintTonic !== null &&
                   ((tonic === hintTonic && scores[m].mode === "major") ||
                    (tonic === hintMinor && scores[m].mode === "minor")));
            if (matchesHint) {
                // Trust the score's key signature unless the evidence clearly overrides it.
                cand.s *= 1.08;
            }
            if (!best || cand.s > best.s) { second = best; best = cand; }
            else if (!second || cand.s > second.s) { second = cand; }
        }
    }
    var conf = (best && second && best.s > 0) ? (best.s - second.s) / best.s : 0;
    return { tonicPc: best.tonicPc, mode: best.mode, confidence: conf };
}

// ---------------------------------------------------------------------------
//  Roman-numeral analysis
// ---------------------------------------------------------------------------

var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

// semitone-from-tonic -> [degreeNumber(1..7), accidental("","b","#")]
var DEGREE_MAJOR = {
    0: [1, ""], 1: [2, "b"], 2: [2, ""], 3: [3, "b"], 4: [3, ""], 5: [4, ""],
    6: [4, "#"], 7: [5, ""], 8: [6, "b"], 9: [6, ""], 10: [7, "b"], 11: [7, ""]
};
var DEGREE_MINOR = {
    0: [1, ""], 1: [2, "b"], 2: [2, ""], 3: [3, ""], 4: [3, "#"], 5: [4, ""],
    6: [4, "#"], 7: [5, ""], 8: [6, ""], 9: [6, "#"], 10: [7, ""], 11: [7, "#"]
};

// Diatonic pitch classes (semitones from tonic) used for "is chromatic" checks.
var SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11];
var SCALE_MINOR = [0, 2, 3, 5, 7, 8, 10]; // natural minor

function scaleForMode(mode) { return mode === "minor" ? SCALE_MINOR : SCALE_MAJOR; }

// True when any chord tone lies outside the key's diatonic scale.
function chordIsChromatic(chord, key) {
    var scale = scaleForMode(key.mode);
    for (var i = 0; i < chord.chordPcs.length; i++) {
        if (!contains(scale, mod(chord.chordPcs[i] - key.tonicPc, 12))) return true;
    }
    return false;
}

// Figured-bass inversion suffix for triads and sevenths.
function inversionFigure(chord) {
    var seventh = chord.intervals.length >= 4;
    if (!seventh) {
        if (chord.inversion === 1) return "6";
        if (chord.inversion === 2) return "64";
        return "";
    }
    if (chord.inversion === 0) return "7";
    if (chord.inversion === 1) return "65";
    if (chord.inversion === 2) return "43";
    return "42";
}

// Roman numeral for a chord within a key.
// Returns { roman, degree, accidental, isChromatic, function }.
function romanNumeral(chord, key) {
    var semis = mod(chord.rootPc - key.tonicPc, 12);
    var table = key.mode === "minor" ? DEGREE_MINOR : DEGREE_MAJOR;
    var entry = table[semis];
    var degNum = entry[0];
    var acc = entry[1];

    var base = ROMAN[degNum - 1];
    var upper = (chord.triad === "major" || chord.triad === "augmented");
    var numeral = upper ? base : base.toLowerCase();

    var sym = "";
    if (chord.triad === "diminished") {
        sym = (chord.quality === "dim7") ? "\u00b07"
            : (chord.quality === "m7b5") ? "\u00f87" : "\u00b0";
    } else if (chord.triad === "augmented") {
        sym = "+";
    } else if (chord.intervals.length >= 4) {
        sym = "7";
        if (chord.quality === "maj7") sym = "maj7";
    }

    var fig = inversionFigure(chord);
    // A seventh's "7" is folded into the inversion figure; avoid doubling it.
    if (chord.intervals.length >= 4 && (sym === "7")) sym = "";

    var roman = acc + numeral + sym + fig;
    var diatonic = contains(scaleForMode(key.mode), semis);

    return {
        roman: roman,
        degree: degNum,
        accidental: acc,
        isChromatic: !diatonic,
        "function": harmonicFunction(degNum, chord.triad)
    };
}

// Coarse tonal function for teaching: T (tonic), PD (pre-dominant), D (dominant).
function harmonicFunction(degNum, triad) {
    switch (degNum) {
        case 1: return "T";
        case 3: return "T";
        case 6: return "T";
        case 2: return "PD";
        case 4: return "PD";
        case 5: return "D";
        case 7: return "D";
        default: return "";
    }
}

// ---------------------------------------------------------------------------
//  Relationship classifiers - the pedagogical "pointing out" features
// ---------------------------------------------------------------------------

function commonToneCount(a, b) {
    var n = 0;
    for (var i = 0; i < a.length; i++) if (contains(b, a[i])) n++;
    return n;
}

function isThirdApart(rootA, rootB) {
    var d = mod(rootB - rootA, 12);
    return d === 3 || d === 4 || d === 8 || d === 9;
}

// Classify the third-relationship between two triads.
// Returns null or { type, commonTones, sameQuality, description }.
//   chromatic-mediant         : roots a 3rd apart, exactly 1 common tone
//   doubly-chromatic-mediant  : roots a 3rd apart, 0 common tones
//   diatonic-mediant          : roots a 3rd apart, 2 common tones (e.g. I-vi)
function classifyMediant(a, b) {
    if (!a || !b) return null;
    if (a.triad === "sus" || b.triad === "sus") return null;
    if (!isThirdApart(a.rootPc, b.rootPc)) return null;

    var triadPcs = function (c) { return [c.chordPcs[0], c.chordPcs[1], c.chordPcs[2]]; };
    var common = commonToneCount(triadPcs(a), triadPcs(b));
    var sameQuality = (a.triad === b.triad);

    var type, desc;
    var nameA = pcToName(a.rootPc, false) + (a.triad === "minor" ? "m" : a.triad === "diminished" ? "\u00b0" : "");
    var nameB = pcToName(b.rootPc, false) + (b.triad === "minor" ? "m" : b.triad === "diminished" ? "\u00b0" : "");

    if (common >= 2) {
        type = "diatonic-mediant";
        desc = "Diatonic mediant " + nameA + " \u2192 " + nameB + " (2 common tones)";
    } else if (common === 1) {
        type = "chromatic-mediant";
        desc = "Chromatic mediant " + nameA + " \u2192 " + nameB +
               (sameQuality ? " (same quality, 1 common tone)" : " (1 common tone)");
    } else {
        type = "doubly-chromatic-mediant";
        desc = "Doubly-chromatic mediant " + nameA + " \u2192 " + nameB + " (no common tones)";
    }
    return { type: type, commonTones: common, sameQuality: sameQuality, description: desc };
}

// Detect a secondary-dominant tonicisation a -> b within a key.
// a is the (chromatic) dominant-functioning chord, b the tonicised target.
// Returns null or { label, targetRoman, leadingTone, resolved }.
function classifySecondaryDominant(a, b, key) {
    if (!a || !b) return null;

    var targetRoot = b.rootPc;
    // Skip when the target is the actual tonic (that is just a normal V-I / vii-I).
    if (mod(targetRoot - key.tonicPc, 12) === 0) return null;

    var bRoman = romanNumeral(b, key);
    var targetLabel = ROMAN[bRoman.degree - 1];
    if (b.triad === "minor" || b.triad === "diminished") targetLabel = targetLabel.toLowerCase();
    targetLabel = bRoman.accidental + targetLabel;

    // a must be chromatic relative to the key to qualify as a *secondary* function.
    if (!chordIsChromatic(a, key)) return null;

    // Applied dominant: major triad or dominant 7th a perfect 5th above the target.
    var isDom = (a.triad === "major") || (a.quality === "7");
    if (isDom && mod(a.rootPc - targetRoot, 12) === 7) {
        return {
            label: (a.quality === "7" ? "V7" : "V") + "/" + targetLabel,
            targetRoman: targetLabel,
            leadingTone: false,
            resolved: true
        };
    }
    // Applied leading-tone chord: diminished (7th) a semitone below the target.
    var isLT = (a.triad === "diminished");
    if (isLT && mod(a.rootPc - targetRoot, 12) === 11) {
        var ltSym = (a.quality === "dim7") ? "\u00b07" : (a.quality === "m7b5") ? "\u00f87" : "\u00b0";
        return {
            label: "vii" + ltSym + "/" + targetLabel,
            targetRoman: targetLabel,
            leadingTone: true,
            resolved: true
        };
    }
    return null;
}

// Detect modal mixture / chromatic pre-dominants relative to the key.
// Returns an array of { name, description } (possibly empty).
function classifyBorrowed(chord, key) {
    var out = [];
    var semis = mod(chord.rootPc - key.tonicPc, 12);
    var scale = scaleForMode(key.mode);
    var anyChromatic = false;
    for (var i = 0; i < chord.chordPcs.length; i++) {
        if (!contains(scale, mod(chord.chordPcs[i] - key.tonicPc, 12))) { anyChromatic = true; break; }
    }

    // Neapolitan: major triad on the lowered second degree.
    if (semis === 1 && chord.triad === "major") {
        out.push({ name: "Neapolitan", description: "Neapolitan chord (bII) - a major triad on b2, typically in first inversion (N6)" });
    }

    // Augmented sixth chords are built on b6 and contain 1 and #4.
    var hasB6 = contains(chord.chordPcs, mod(key.tonicPc + 8, 12));
    var hasTonic = contains(chord.chordPcs, key.tonicPc);
    var hasSharp4 = contains(chord.chordPcs, mod(key.tonicPc + 6, 12));
    if (hasB6 && hasTonic && hasSharp4) {
        var has2 = contains(chord.chordPcs, mod(key.tonicPc + 2, 12));
        var hasB3 = contains(chord.chordPcs, mod(key.tonicPc + 3, 12));
        var kind = has2 ? "French" : hasB3 ? "German" : "Italian";
        out.push({ name: "Augmented sixth", description: kind + " augmented sixth chord (built on b6, resolves outward to the dominant)" });
        return out;
    }

    if (key.mode === "major" && anyChromatic) {
        if (semis === 0 && chord.triad === "minor") out.push({ name: "Mixture", description: "Borrowed i - minor tonic from the parallel minor" });
        if (semis === 3 && chord.triad === "major") out.push({ name: "Mixture", description: "Borrowed bIII from the parallel minor" });
        if (semis === 5 && chord.triad === "minor") out.push({ name: "Mixture", description: "Borrowed iv (minor subdominant) from the parallel minor" });
        if (semis === 8 && chord.triad === "major") out.push({ name: "Mixture", description: "Borrowed bVI from the parallel minor" });
        if (semis === 10 && chord.triad === "major") out.push({ name: "Mixture", description: "Borrowed bVII from the parallel minor" });
        if (semis === 9 && chord.triad === "diminished") out.push({ name: "Mixture", description: "Borrowed ii\u00b0 from the parallel minor" });
    }
    if (key.mode === "minor" && anyChromatic) {
        if (semis === 0 && chord.triad === "major") out.push({ name: "Picardy", description: "Picardy third - major tonic ending a minor-key passage" });
        if (semis === 9 && chord.triad === "major") out.push({ name: "Mixture", description: "Raised submediant (borrowed from the parallel major / Dorian)" });
    }
    return out;
}

// Scale degree (1..7, or 0 if chromatic) of a pitch class within a key.
function scaleDegree(pc, key) {
    var table = key.mode === "minor" ? DEGREE_MINOR : DEGREE_MAJOR;
    var entry = table[mod(pc - key.tonicPc, 12)];
    return entry ? entry[0] : 0;
}

// True when a pitch class belongs to the key's diatonic scale.
function isDiatonic(pc, key) {
    return contains(scaleForMode(key.mode), mod(pc - key.tonicPc, 12));
}

// Classify a cadence from the final two chords.
// sopranoPcPrev / sopranoPcLast: top-voice pitch classes (for PAC vs IAC).
// Returns { type, description } with type in PAC/IAC/HC/DC/PC or null.
function classifyCadence(prev, last, sopranoPcPrev, sopranoPcLast, key) {
    if (!last) return null;
    var lastSemis = mod(last.rootPc - key.tonicPc, 12);
    var prevSemis = prev ? mod(prev.rootPc - key.tonicPc, 12) : -1;
    var prevIsDominant = prev && (prevSemis === 7) && (prev.triad === "major" || prev.quality === "7");

    // Half cadence: phrase ends on V.
    if (lastSemis === 7 && (last.triad === "major" || last.quality === "7")) {
        return { type: "HC", description: "Half cadence (ends on V)" };
    }
    // Authentic cadence: V -> I.
    if (prevIsDominant && lastSemis === 0 && (last.triad === "major" || last.triad === "minor")) {
        var rootPosition = (prev.inversion === 0 && last.inversion === 0);
        var sopOnTonic = (typeof sopranoPcLast === "number") && (scaleDegree(sopranoPcLast, key) === 1);
        if (rootPosition && sopOnTonic) {
            return { type: "PAC", description: "Perfect authentic cadence (V-I, both root position, soprano on tonic)" };
        }
        return { type: "IAC", description: "Imperfect authentic cadence (V-I, inverted or soprano not on tonic)" };
    }
    // Deceptive cadence: V -> vi/VI.
    if (prevIsDominant && lastSemis === 9) {
        return { type: "DC", description: "Deceptive cadence (V-vi)" };
    }
    // Plagal cadence: IV/iv -> I.
    if (prev && prevSemis === 5 && lastSemis === 0) {
        return { type: "PC", description: "Plagal cadence (IV-I, the \u201camen\u201d cadence)" };
    }
    return null;
}

// ---------------------------------------------------------------------------
//  Intervals
// ---------------------------------------------------------------------------

var INTERVAL_NAMES = [
    "P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"
];
var INTERVAL_LONG = {
    "P1": "perfect unison", "m2": "minor second", "M2": "major second",
    "m3": "minor third", "M3": "major third", "P4": "perfect fourth",
    "TT": "tritone", "P5": "perfect fifth", "m6": "minor sixth",
    "M6": "major sixth", "m7": "minor seventh", "M7": "major seventh", "P8": "perfect octave"
};

// Name of the interval between two MIDI pitches (or two pitch classes).
// Returns { semitones, simpleSemitones, name, longName, consonant }.
function intervalBetween(lowPitch, highPitch) {
    var semis = Math.abs(highPitch - lowPitch);
    var simple = mod(semis, 12);
    var name = (semis !== 0 && simple === 0) ? "P8" : INTERVAL_NAMES[simple];
    var consonant = (simple === 0 || simple === 3 || simple === 4 ||
                     simple === 7 || simple === 8 || simple === 9);
    return {
        semitones: semis,
        simpleSemitones: simple,
        name: name,
        longName: INTERVAL_LONG[name] || name,
        consonant: consonant,
        perfect: (simple === 0 || simple === 5 || simple === 7)
    };
}

// ---------------------------------------------------------------------------
//  Scales & modes
// ---------------------------------------------------------------------------

var SCALE_TEMPLATES = [
    { name: "major (Ionian)",   intervals: [0, 2, 4, 5, 7, 9, 11] },
    { name: "natural minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10] },
    { name: "harmonic minor",   intervals: [0, 2, 3, 5, 7, 8, 11] },
    { name: "melodic minor",    intervals: [0, 2, 3, 5, 7, 9, 11] },
    { name: "Dorian",           intervals: [0, 2, 3, 5, 7, 9, 10] },
    { name: "Phrygian",         intervals: [0, 1, 3, 5, 7, 8, 10] },
    { name: "Lydian",           intervals: [0, 2, 4, 6, 7, 9, 11] },
    { name: "Mixolydian",       intervals: [0, 2, 4, 5, 7, 9, 10] },
    { name: "Locrian",          intervals: [0, 1, 3, 5, 6, 8, 10] },
    { name: "major pentatonic", intervals: [0, 2, 4, 7, 9] },
    { name: "minor pentatonic", intervals: [0, 3, 5, 7, 10] },
    { name: "blues",            intervals: [0, 3, 5, 6, 7, 10] },
    { name: "whole tone",       intervals: [0, 2, 4, 6, 8, 10] },
    { name: "chromatic",        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
];

// Identify scales/modes that contain a set of pitch classes for a given tonic.
// Returns an array of { name, exact } sorted with exact (size-matching) first.
function identifyScale(pitchClasses, tonicPc) {
    var pcs = uniqueSorted(pitchClasses);
    var rel = [];
    for (var i = 0; i < pcs.length; i++) rel.push(mod(pcs[i] - tonicPc, 12));
    var matches = [];
    for (var t = 0; t < SCALE_TEMPLATES.length; t++) {
        var tmpl = SCALE_TEMPLATES[t];
        var contained = true;
        for (var k = 0; k < rel.length; k++) {
            if (!contains(tmpl.intervals, rel[k])) { contained = false; break; }
        }
        if (contained) {
            matches.push({ name: tmpl.name, exact: (rel.length === tmpl.intervals.length),
                           size: tmpl.intervals.length });
        }
    }
    matches.sort(function (a, b) {
        if (a.exact !== b.exact) return a.exact ? -1 : 1;
        return a.size - b.size;
    });
    return matches;
}

// ---------------------------------------------------------------------------
//  Non-chord tones (melodic dissonances)
// ---------------------------------------------------------------------------

function isStep(a, b) { var d = Math.abs(a - b); return d === 1 || d === 2; }

// Classify a melodic tone against the prevailing chord, using its neighbours.
// prevPitch/nextPitch may be null at phrase edges. Pitches are MIDI numbers.
// Returns null when the tone is a chord tone, else { type, description }.
function classifyNonChordTone(prevPitch, pitch, nextPitch, chordPcs) {
    if (contains(chordPcs, mod(pitch, 12))) return null;
    var hasPrev = (typeof prevPitch === "number");
    var hasNext = (typeof nextPitch === "number");

    if (hasPrev && hasNext) {
        var stepIn = isStep(prevPitch, pitch);
        var stepOut = isStep(pitch, nextPitch);
        var dirIn = pitch - prevPitch;
        var dirOut = nextPitch - pitch;
        if (stepIn && stepOut && (dirIn > 0) === (dirOut > 0))
            return { type: "passing", description: "Passing tone (step in, step on in same direction)" };
        if (stepIn && stepOut && nextPitch === prevPitch)
            return { type: "neighbor", description: "Neighbor tone (steps away and back)" };
        // A held-over tone (no approach motion) resolving by step is a suspension.
        // Checked before appoggiatura because prevPitch === pitch makes stepIn false.
        if (prevPitch === pitch && stepOut)
            return { type: "suspension", description: "Suspension / retardation (held over, resolves by step)" };
        if (!stepIn && stepOut)
            return { type: "appoggiatura", description: "Appoggiatura (leap in, step out)" };
        if (stepIn && !stepOut)
            return { type: "escape", description: "Escape tone (step in, leap out)" };
    } else if (hasNext && !hasPrev) {
        return { type: "anticipation", description: "Possible anticipation (no preceding tone)" };
    }
    return { type: "unprepared", description: "Unprepared non-chord tone" };
}

// ---------------------------------------------------------------------------
//  Voice leading
// ---------------------------------------------------------------------------

// Detect parallel/direct perfect fifths and octaves between two chords.
// Each chord is an array of MIDI pitches ordered low -> high (one per voice).
// Returns an array of { type, voices:[i,j], description }.
function checkVoiceLeading(prevVoices, currVoices) {
    var issues = [];
    if (!prevVoices || !currVoices) return issues;
    var n = Math.min(prevVoices.length, currVoices.length);
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            var prevInt = mod(prevVoices[j] - prevVoices[i], 12);
            var currInt = mod(currVoices[j] - currVoices[i], 12);
            var moved = (prevVoices[i] !== currVoices[i]) || (prevVoices[j] !== currVoices[j]);
            if (!moved) continue;
            if (prevInt === 7 && currInt === 7)
                issues.push({ type: "parallel-fifths", voices: [i, j],
                              description: "Parallel perfect fifths between voices " + (i + 1) + " and " + (j + 1) });
            if (prevInt === 0 && currInt === 0)
                issues.push({ type: "parallel-octaves", voices: [i, j],
                              description: "Parallel octaves between voices " + (i + 1) + " and " + (j + 1) });
        }
    }
    return issues;
}

// ---------------------------------------------------------------------------
//  Aggregate analysis
// ---------------------------------------------------------------------------

// Insight colours (hex) used for note colouring / text emphasis.
var COLORS = {
    roman: "#000000",
    mediant: "#8e24aa",     // purple
    secondary: "#1565c0",   // blue
    borrowed: "#ef6c00",    // orange
    cadence: "#2e7d32"      // green
};

// Given an ordered array of chord events, produce teaching insights.
// event = { tick, measure, beat, pitchClasses:[..], bassPc, sopranoPc }
// Returns { key, items:[{ tick, measure, kind, text, color, anchorTick }] }.
function analyzeProgression(events, keyHint) {
    var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
    var i, e;
    for (i = 0; i < events.length; i++) {
        var pcs = events[i].pitchClasses || [];
        var w = events[i].durationTicks || 1;
        for (var p = 0; p < pcs.length; p++) hist[mod(pcs[p], 12)] += w;
    }
    var key = detectKey(hist, keyHint);

    // Resolve chords once.
    for (i = 0; i < events.length; i++) {
        e = events[i];
        e.chord = identifyChord(e.pitchClasses || [], e.bassPc);
    }

    var items = [];
    var prev = null;
    for (i = 0; i < events.length; i++) {
        e = events[i];
        if (!e.chord) { prev = null; continue; }

        var rn = romanNumeral(e.chord, key);
        items.push({ tick: e.tick, measure: e.measure, kind: "roman",
                     text: rn.roman, color: COLORS.roman, anchorTick: e.tick });

        var borrowed = classifyBorrowed(e.chord, key);
        for (var bi = 0; bi < borrowed.length; bi++) {
            items.push({ tick: e.tick, measure: e.measure, kind: "borrowed",
                         text: borrowed[bi].name + ": " + borrowed[bi].description,
                         color: COLORS.borrowed, anchorTick: e.tick });
        }

        if (prev && prev.chord) {
            var med = classifyMediant(prev.chord, e.chord);
            if (med && med.type !== "diatonic-mediant") {
                items.push({ tick: e.tick, measure: e.measure, kind: "mediant",
                             text: med.description, color: COLORS.mediant, anchorTick: e.tick });
            }
            var sd = classifySecondaryDominant(prev.chord, e.chord, key);
            if (sd) {
                items.push({ tick: prev.tick, measure: prev.measure, kind: "secondary",
                             text: "Secondary dominant " + sd.label, color: COLORS.secondary,
                             anchorTick: prev.tick });
            }
            var cad = classifyCadence(prev.chord, e.chord, prev.sopranoPc, e.sopranoPc, key);
            if (cad) {
                items.push({ tick: e.tick, measure: e.measure, kind: "cadence",
                             text: cad.type + ": " + cad.description, color: COLORS.cadence,
                             anchorTick: e.tick });
            }
        }
        prev = e;
    }
    return { key: key, items: items };
}

function keyName(key) {
    return pcToName(key.tonicPc, key.mode === "minor") + " " + key.mode;
}

// ---------------------------------------------------------------------------
//  Node.js interop (ignored by the QML engine)
// ---------------------------------------------------------------------------
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        mod: mod,
        tpcToPc: tpcToPc,
        tpcToName: tpcToName,
        pcToName: pcToName,
        CHORD_TEMPLATES: CHORD_TEMPLATES,
        identifyChord: identifyChord,
        chordLabel: chordLabel,
        detectKey: detectKey,
        romanNumeral: romanNumeral,
        harmonicFunction: harmonicFunction,
        classifyMediant: classifyMediant,
        classifySecondaryDominant: classifySecondaryDominant,
        classifyBorrowed: classifyBorrowed,
        classifyCadence: classifyCadence,
        scaleDegree: scaleDegree,
        isDiatonic: isDiatonic,
        chordIsChromatic: chordIsChromatic,
        intervalBetween: intervalBetween,
        identifyScale: identifyScale,
        classifyNonChordTone: classifyNonChordTone,
        checkVoiceLeading: checkVoiceLeading,
        SCALE_TEMPLATES: SCALE_TEMPLATES,
        analyzeProgression: analyzeProgression,
        keyName: keyName,
        COLORS: COLORS
    };
}
