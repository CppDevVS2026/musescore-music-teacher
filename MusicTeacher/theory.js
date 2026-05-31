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
    { quality: "minMaj7", intervals: [0, 3, 7, 11],  symbol: "m(maj7)", triad: "minor" },
    { quality: "9",       intervals: [0, 4, 7, 10, 2], symbol: "9",      triad: "major" },
    { quality: "maj9",    intervals: [0, 4, 7, 11, 2], symbol: "maj9",   triad: "major" },
    { quality: "min9",    intervals: [0, 3, 7, 10, 2], symbol: "m9",     triad: "minor" },
    { quality: "add9",    intervals: [0, 4, 7, 2],     symbol: "add9",   triad: "major", _penalty: 12 },
    { quality: "6",       intervals: [0, 4, 7, 9],     symbol: "6",      triad: "major" },
    { quality: "min6",    intervals: [0, 3, 7, 9],     symbol: "m6",     triad: "minor" },
    { quality: "aug7",    intervals: [0, 4, 8, 10],    symbol: "+7",     triad: "augmented" },
    { quality: "7sus4",   intervals: [0, 5, 7, 10],    symbol: "7sus4",  triad: "sus" },
    { quality: "pow",     intervals: [0, 7],            symbol: "5",      triad: "power" }
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
    if (pcs.length < 2) return null;

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
            if (tmpl._penalty) score -= tmpl._penalty;
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
//  Extended chord templates (added 9ths, 6ths, aug7, 7sus4, power chords)
//  are already in CHORD_TEMPLATES above.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
//  Modulation detection (windowed key detection)
// ---------------------------------------------------------------------------

// Detect key regions across a piece using a sliding window.
// events: array of chord events (from analyzeProgression format).
// windowSize: number of events per window (default 6).
// Returns array of { startTick, endTick, startMeasure, endMeasure, key, confidence }.
function detectModulations(events, windowSize) {
    if (!windowSize) windowSize = 6;
    if (events.length < windowSize) {
        var hist0 = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var q = 0; q < events.length; q++) {
            var pcs0 = events[q].pitchClasses || [];
            var w0 = events[q].durationTicks || 1;
            for (var r = 0; r < pcs0.length; r++) hist0[mod(pcs0[r], 12)] += w0;
        }
        var k0 = detectKey(hist0);
        return [{ startTick: events[0].tick, endTick: events[events.length - 1].tick,
                  startMeasure: events[0].measure || 1, endMeasure: events[events.length - 1].measure || 1,
                  key: k0, confidence: k0.confidence }];
    }

    var regions = [];
    var step = Math.max(1, Math.floor(windowSize / 2));
    for (var i = 0; i <= events.length - windowSize; i += step) {
        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var j = i; j < i + windowSize && j < events.length; j++) {
            var pcs = events[j].pitchClasses || [];
            var w = events[j].durationTicks || 1;
            for (var p = 0; p < pcs.length; p++) hist[mod(pcs[p], 12)] += w;
        }
        var key = detectKey(hist);
        var endIdx = Math.min(i + windowSize - 1, events.length - 1);
        regions.push({
            startTick: events[i].tick, endTick: events[endIdx].tick,
            startMeasure: events[i].measure || 1, endMeasure: events[endIdx].measure || 1,
            key: key, confidence: key.confidence
        });
    }

    // Merge adjacent regions with the same key.
    var merged = [regions[0]];
    for (var m = 1; m < regions.length; m++) {
        var prev = merged[merged.length - 1];
        if (regions[m].key.tonicPc === prev.key.tonicPc && regions[m].key.mode === prev.key.mode) {
            prev.endTick = regions[m].endTick;
            prev.endMeasure = regions[m].endMeasure;
            prev.confidence = Math.max(prev.confidence, regions[m].confidence);
        } else {
            merged.push(regions[m]);
        }
    }
    return merged;
}

// Identify a pivot chord that belongs to both keys at a modulation boundary.
// prevKey, newKey: { tonicPc, mode }. chord: result of identifyChord.
// Returns { romanInOld, romanInNew } or null.
function findPivotChord(chord, prevKey, newKey) {
    if (!chord) return null;
    var rnOld = romanNumeral(chord, prevKey);
    var rnNew = romanNumeral(chord, newKey);
    var diatonicInOld = !rnOld.isChromatic;
    var diatonicInNew = !rnNew.isChromatic;
    if (diatonicInOld && diatonicInNew) {
        return { romanInOld: rnOld.roman, romanInNew: rnNew.roman };
    }
    return null;
}

// ---------------------------------------------------------------------------
//  Sequence detection
// ---------------------------------------------------------------------------

// Detect melodic/harmonic sequences (repeated intervallic patterns).
// rootPcs: array of root pitch classes from successive chords.
// Returns array of { startIndex, length, interval, direction, type }.
function detectSequences(rootPcs) {
    var results = [];
    if (rootPcs.length < 4) return results;

    for (var len = 1; len <= Math.floor(rootPcs.length / 2); len++) {
        for (var start = 0; start <= rootPcs.length - len * 2; start++) {
            // Compute the transposition interval between the first unit and the second.
            var transposition = mod(rootPcs[start + len] - rootPcs[start], 12);
            if (transposition === 0) continue;

            var reps = 1;
            for (var rep = 1; start + (rep + 1) * len <= rootPcs.length; rep++) {
                var ok = true;
                for (var k = 0; k < len; k++) {
                    var expected = mod(rootPcs[start + rep * len - len + k] + transposition, 12);
                    if (rootPcs[start + rep * len + k] !== expected) { ok = false; break; }
                }
                if (ok) reps++; else break;
            }

            var minReps = (len === 1) ? 3 : 2;
            if (reps >= minReps) {
                var direction = transposition <= 6 ? "ascending" : "descending";
                var simpleInt = transposition <= 6 ? transposition : 12 - transposition;
                var type;
                if (simpleInt === 5 || simpleInt === 7) type = "circle-of-fifths";
                else if (simpleInt === 1 || simpleInt === 2) type = "stepwise";
                else if (simpleInt === 3 || simpleInt === 4) type = "by-thirds";
                else type = "other";
                results.push({
                    startIndex: start, length: len, repetitions: reps,
                    interval: transposition, direction: direction, type: type
                });
            }
        }
    }

    // Remove duplicates: keep the longest sequence at each start position.
    var best = {};
    for (var s = 0; s < results.length; s++) {
        var key = results[s].startIndex;
        if (!best[key] || results[s].length * results[s].repetitions > best[key].length * best[key].repetitions) {
            best[key] = results[s];
        }
    }
    var out = [];
    for (var b in best) if (best.hasOwnProperty(b)) out.push(best[b]);
    out.sort(function (a, b) { return a.startIndex - b.startIndex; });
    return out;
}

// ---------------------------------------------------------------------------
//  Pedal point detection
// ---------------------------------------------------------------------------

// Detect sustained bass notes held while harmonies change above.
// events: array with bassPc and chord fields.
// minLength: minimum consecutive events with same bass to qualify (default 3).
// Returns array of { bassPc, startIndex, endIndex, startTick, endTick, startMeasure, endMeasure, type }.
function detectPedalPoints(events, minLength) {
    if (!minLength) minLength = 3;
    var results = [];
    var i = 0;
    while (i < events.length) {
        var bassPc = events[i].bassPc;
        var j = i + 1;
        while (j < events.length && events[j].bassPc === bassPc) j++;
        var run = j - i;
        if (run >= minLength) {
            // Check that the harmony actually changes above the pedal.
            var harmoniesChanged = false;
            for (var k = i + 1; k < j; k++) {
                var c1 = events[i].chord || identifyChord(events[i].pitchClasses || [], events[i].bassPc);
                var c2 = events[k].chord || identifyChord(events[k].pitchClasses || [], events[k].bassPc);
                if (c1 && c2 && c1.rootPc !== c2.rootPc) { harmoniesChanged = true; break; }
            }
            if (harmoniesChanged) {
                var type = "tonic";
                // We'll classify it later when we have the key.
                results.push({
                    bassPc: bassPc, startIndex: i, endIndex: j - 1,
                    startTick: events[i].tick, endTick: events[j - 1].tick,
                    startMeasure: events[i].measure || 1, endMeasure: events[j - 1].measure || 1,
                    type: type, length: run
                });
            }
        }
        i = j;
    }
    return results;
}

// Classify the pedal type (tonic, dominant, other) given the key.
function classifyPedalType(pedalBassPc, key) {
    var degree = mod(pedalBassPc - key.tonicPc, 12);
    if (degree === 0) return "tonic";
    if (degree === 7) return "dominant";
    if (degree === 5) return "subdominant";
    return "other";
}

// ---------------------------------------------------------------------------
//  Harmonic rhythm analysis
// ---------------------------------------------------------------------------

// Compute the harmonic rhythm: how many chord changes per measure.
// events: array with chord and measure fields.
// Returns array of { measure, chordChanges, chords:[] }.
function analyzeHarmonicRhythm(events) {
    if (events.length === 0) return [];
    var measures = {};
    var prevRoot = -1;
    for (var i = 0; i < events.length; i++) {
        var m = events[i].measure || 1;
        if (!measures[m]) measures[m] = { measure: m, chordChanges: 0, chords: [] };
        var chord = events[i].chord || identifyChord(events[i].pitchClasses || [], events[i].bassPc);
        if (chord) {
            var curRoot = chord.rootPc * 100 + (chord.quality === "min" ? 1 : 0);
            if (curRoot !== prevRoot) {
                measures[m].chordChanges++;
                measures[m].chords.push(chordLabel(chord));
                prevRoot = curRoot;
            }
        }
    }
    var out = [];
    for (var mk in measures) if (measures.hasOwnProperty(mk)) out.push(measures[mk]);
    out.sort(function (a, b) { return a.measure - b.measure; });
    return out;
}

// ---------------------------------------------------------------------------
//  Tendency tone resolution
// ---------------------------------------------------------------------------

// Check whether the leading tone (scale degree 7) resolves up to tonic,
// and whether the chordal 7th resolves down by step.
// prevEvent, currEvent: events with pitches/pitchClasses arrays.
// key: { tonicPc, mode }.
// Returns array of { type, description, resolved }.
function checkTendencyTones(prevEvent, currEvent, key) {
    var issues = [];
    if (!prevEvent || !currEvent) return issues;

    var leadingTonePc = mod(key.tonicPc - 1, 12); // semitone below tonic
    var tonicPc = key.tonicPc;

    var prevPitches = prevEvent.pitches || [];
    var currPitches = currEvent.pitches || [];

    // Check leading tone resolution.
    for (var i = 0; i < prevPitches.length; i++) {
        if (mod(prevPitches[i], 12) === leadingTonePc) {
            // Look for resolution to tonic in currPitches in the same register.
            var resolved = false;
            for (var j = 0; j < currPitches.length; j++) {
                if (mod(currPitches[j], 12) === tonicPc && Math.abs(currPitches[j] - prevPitches[i]) <= 2) {
                    resolved = true; break;
                }
            }
            issues.push({
                type: "leading-tone",
                description: resolved
                    ? "Leading tone (" + pcToName(leadingTonePc, false) + ") resolved up to tonic"
                    : "Leading tone (" + pcToName(leadingTonePc, false) + ") did NOT resolve up to tonic",
                resolved: resolved
            });
        }
    }

    // Check chordal 7th resolution (dominant 7th -> tonic).
    var prevChord = prevEvent.chord || identifyChord(prevEvent.pitchClasses || [], prevEvent.bassPc);
    if (prevChord && prevChord.intervals.length >= 4) {
        var seventhPc = mod(prevChord.rootPc + prevChord.intervals[3], 12);
        for (var s = 0; s < prevPitches.length; s++) {
            if (mod(prevPitches[s], 12) === seventhPc) {
                var stepDown1 = mod(seventhPc - 1, 12);
                var stepDown2 = mod(seventhPc - 2, 12);
                var res7 = false;
                for (var t = 0; t < currPitches.length; t++) {
                    var cp = mod(currPitches[t], 12);
                    if ((cp === stepDown1 || cp === stepDown2) && Math.abs(currPitches[t] - prevPitches[s]) <= 2) {
                        res7 = true; break;
                    }
                }
                issues.push({
                    type: "chordal-seventh",
                    description: res7
                        ? "Chordal 7th (" + pcToName(seventhPc, false) + ") resolved down by step"
                        : "Chordal 7th (" + pcToName(seventhPc, false) + ") did NOT resolve down by step",
                    resolved: res7
                });
                break;
            }
        }
    }
    return issues;
}

// ---------------------------------------------------------------------------
//  Tritone substitution detection
// ---------------------------------------------------------------------------

// Detect tritone substitutions: a dominant-quality chord whose root is a
// tritone (6 semitones) from the expected V of the target.
// a: the potential tritone sub chord, b: the target/resolution chord, key: current key.
// Returns null or { label, description }.
function classifyTritoneSub(a, b, key) {
    if (!a || !b) return null;
    if (a.quality !== "7" && a.triad !== "major") return null;

    // The normal V of b would be a P5 above b's root.
    var expectedV = mod(b.rootPc + 7, 12);
    // Tritone sub is a tritone away from that expected V.
    var tritoneDist = mod(a.rootPc - expectedV, 12);
    if (tritoneDist !== 6) return null;

    // Also confirm a resolves down by half step to b.
    var rootMotion = mod(b.rootPc - a.rootPc, 12);
    if (rootMotion !== 1 && rootMotion !== 11) return null;

    var bRn = romanNumeral(b, key);
    var targetLabel = bRn.accidental + ROMAN[bRn.degree - 1];
    if (b.triad === "minor" || b.triad === "diminished") targetLabel = targetLabel.toLowerCase();

    return {
        label: "SubV/" + targetLabel,
        description: "Tritone substitution of V/" + targetLabel +
                     " (" + pcToName(a.rootPc, false) + "7 resolves to " + pcToName(b.rootPc, false) + ")"
    };
}

// ---------------------------------------------------------------------------
//  Motion type classification
// ---------------------------------------------------------------------------

// Classify the motion between two voice pairs.
// Returns "parallel", "similar", "contrary", "oblique", or "static".
function classifyMotion(prevLow, prevHigh, currLow, currHigh) {
    var lowMotion = currLow - prevLow;
    var highMotion = currHigh - prevHigh;
    if (lowMotion === 0 && highMotion === 0) return "static";
    if (lowMotion === 0 || highMotion === 0) return "oblique";
    if ((lowMotion > 0) === (highMotion > 0)) {
        // Same direction.
        if (Math.abs(lowMotion) === Math.abs(highMotion)) return "parallel";
        return "similar";
    }
    return "contrary";
}

// Analyse motion types across all voice pairs in two chords.
// prevVoices, currVoices: arrays of MIDI pitches (sorted low to high).
// Returns array of { voices:[i,j], motion }.
function analyzeMotionTypes(prevVoices, currVoices) {
    var results = [];
    if (!prevVoices || !currVoices) return results;
    var n = Math.min(prevVoices.length, currVoices.length);
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            results.push({
                voices: [i, j],
                motion: classifyMotion(prevVoices[i], prevVoices[j], currVoices[i], currVoices[j])
            });
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
//  Hidden (direct) 5ths and 8ves
// ---------------------------------------------------------------------------

// Detect hidden/direct fifths and octaves (both voices move in the same
// direction to a perfect interval, with the upper voice moving by leap).
function checkHiddenIntervals(prevVoices, currVoices) {
    var issues = [];
    if (!prevVoices || !currVoices) return issues;
    var n = Math.min(prevVoices.length, currVoices.length);
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            var currInt = mod(currVoices[j] - currVoices[i], 12);
            if (currInt !== 7 && currInt !== 0) continue;
            var prevInt = mod(prevVoices[j] - prevVoices[i], 12);
            if (prevInt === currInt) continue; // that's a parallel, not hidden

            var lowMotion = currVoices[i] - prevVoices[i];
            var highMotion = currVoices[j] - prevVoices[j];
            // Same direction (both up or both down).
            if (lowMotion === 0 || highMotion === 0) continue;
            if ((lowMotion > 0) !== (highMotion > 0)) continue;
            // Upper voice moves by leap (more than a step).
            if (Math.abs(highMotion) <= 2) continue;

            var label = currInt === 7 ? "hidden-fifths" : "hidden-octaves";
            issues.push({
                type: label, voices: [i, j],
                description: (currInt === 7 ? "Hidden fifths" : "Hidden octaves") +
                             " between voices " + (i + 1) + " and " + (j + 1)
            });
        }
    }
    return issues;
}

// ---------------------------------------------------------------------------
//  Chord voicing analysis
// ---------------------------------------------------------------------------

// Analyze chord voicing: open/close position, spacing, doubling.
// pitches: array of MIDI pitches (sorted low to high).
// chord: result of identifyChord.
// Returns { position, spacingIssues:[], doublings:[] }.
function analyzeVoicing(pitches, chord) {
    if (!pitches || pitches.length < 3) return null;
    var sorted = pitches.slice().sort(function (a, b) { return a - b; });

    // Close position: upper three voices fit within an octave.
    var upperVoices = sorted.slice(sorted.length >= 4 ? 1 : 0);
    var span = upperVoices[upperVoices.length - 1] - upperVoices[0];
    var position = span <= 12 ? "close" : "open";

    // Check spacing between adjacent voices (> P8 is a spacing error in SATB).
    var spacingIssues = [];
    for (var i = 0; i < sorted.length - 1; i++) {
        var gap = sorted[i + 1] - sorted[i];
        // Bass to tenor can be more than an octave; upper voices should be <= P8.
        if (i > 0 && gap > 12) {
            spacingIssues.push({
                voices: [i, i + 1],
                gap: gap,
                description: "Spacing exceeds an octave between voices " + (i + 1) + " and " + (i + 2)
            });
        }
    }

    // Doublings.
    var pcCount = {};
    for (var d = 0; d < sorted.length; d++) {
        var pc = mod(sorted[d], 12);
        pcCount[pc] = (pcCount[pc] || 0) + 1;
    }
    var doublings = [];
    for (var p in pcCount) {
        if (pcCount.hasOwnProperty(p) && pcCount[p] > 1) {
            doublings.push({
                pc: parseInt(p, 10),
                name: pcToName(parseInt(p, 10), false),
                count: pcCount[p]
            });
        }
    }

    return { position: position, spacingIssues: spacingIssues, doublings: doublings };
}

// ---------------------------------------------------------------------------
//  Pitch-class set theory (post-tonal analysis)
// ---------------------------------------------------------------------------

// Compute the normal form of a pitch-class set.
function normalForm(pcsInput) {
    var pcs = uniqueSorted(pcsInput);
    if (pcs.length === 0) return [];
    if (pcs.length === 1) return [pcs[0]];

    var n = pcs.length;
    var best = null;
    for (var r = 0; r < n; r++) {
        var rotation = [];
        for (var i = 0; i < n; i++) rotation.push(mod(pcs[(r + i) % n], 12));
        // Span from first to last.
        var span = mod(rotation[n - 1] - rotation[0], 12);
        if (!best || span < best.span ||
            (span === best.span && compareSetsFromRight(rotation, best.set, n) < 0)) {
            best = { set: rotation, span: span };
        }
    }
    return best.set;
}

function compareSetsFromRight(a, b, n) {
    for (var i = n - 1; i >= 1; i--) {
        var da = mod(a[i] - a[0], 12);
        var db = mod(b[i] - b[0], 12);
        if (da < db) return -1;
        if (da > db) return 1;
    }
    return 0;
}

// Compute the prime form of a pitch-class set (transposed to start on 0,
// and compared with the inversion, picking the more compact).
function primeForm(pcsInput) {
    var nf = normalForm(pcsInput);
    if (nf.length === 0) return [];

    // Transpose to 0.
    var t0 = [];
    for (var i = 0; i < nf.length; i++) t0.push(mod(nf[i] - nf[0], 12));

    // Invert and compute normal form of the inversion.
    var inv = [];
    for (var j = 0; j < nf.length; j++) inv.push(mod(12 - nf[j], 12));
    var invNf = normalForm(inv);
    var invT0 = [];
    for (var k = 0; k < invNf.length; k++) invT0.push(mod(invNf[k] - invNf[0], 12));

    // Pick the more compact one.
    for (var c = invT0.length - 1; c >= 0; c--) {
        if (invT0[c] < t0[c]) return invT0;
        if (invT0[c] > t0[c]) return t0;
    }
    return t0;
}

// Compute the interval vector (interval class content) of a pitch-class set.
function intervalVector(pcsInput) {
    var pcs = uniqueSorted(pcsInput);
    var vec = [0, 0, 0, 0, 0, 0]; // ic 1..6
    for (var i = 0; i < pcs.length; i++) {
        for (var j = i + 1; j < pcs.length; j++) {
            var d = mod(pcs[j] - pcs[i], 12);
            if (d > 6) d = 12 - d;
            if (d >= 1 && d <= 6) vec[d - 1]++;
        }
    }
    return vec;
}

// Format a pitch-class set for display: e.g. [0,1,3,7] -> "{0,1,3,7}".
function formatPcSet(pcs) {
    return "{" + pcs.join(",") + "}";
}

// Well-known Forte set-class names for common cardinalities.
var FORTE_NAMES = {
    "0,1,2": "3-1", "0,1,3": "3-2", "0,1,4": "3-3", "0,1,5": "3-4",
    "0,1,6": "3-5", "0,2,4": "3-6", "0,2,5": "3-7", "0,2,6": "3-8",
    "0,2,7": "3-9", "0,3,6": "3-10", "0,3,7": "3-11", "0,4,8": "3-12",
    "0,1,2,3": "4-1", "0,1,2,4": "4-2", "0,1,3,4": "4-3", "0,1,2,5": "4-4",
    "0,1,2,6": "4-5", "0,1,2,7": "4-6", "0,1,4,5": "4-7", "0,1,5,6": "4-8",
    "0,1,6,7": "4-9", "0,2,3,5": "4-10", "0,1,3,5": "4-11", "0,2,3,6": "4-12",
    "0,1,3,6": "4-13", "0,2,3,7": "4-14", "0,1,4,6": "4-15",
    "0,1,5,7": "4-16", "0,3,4,7": "4-17", "0,1,4,7": "4-18",
    "0,1,4,8": "4-19", "0,1,5,8": "4-20", "0,2,4,6": "4-21",
    "0,2,4,7": "4-22", "0,2,5,7": "4-23", "0,2,4,8": "4-24",
    "0,2,6,8": "4-25", "0,3,5,8": "4-26", "0,2,5,8": "4-27",
    "0,3,6,9": "4-28", "0,1,3,7": "4-29"
};

// Look up the Forte name for a pitch-class set.
function forteName(pcsInput) {
    var pf = primeForm(pcsInput);
    var key = pf.join(",");
    return FORTE_NAMES[key] || (pf.length + "-?");
}

// ---------------------------------------------------------------------------
//  Common-tone diminished 7th detection
// ---------------------------------------------------------------------------

// Detect a common-tone diminished seventh chord: a dim7 chord that shares
// one tone with the surrounding chord(s) and acts as an embellishment.
function classifyCommonToneDim7(chord, neighborChord, key) {
    if (!chord || !neighborChord) return null;
    if (chord.quality !== "dim7") return null;

    var common = commonToneCount(chord.chordPcs, neighborChord.chordPcs);
    if (common === 0) return null;

    var commonTones = [];
    for (var i = 0; i < chord.chordPcs.length; i++) {
        if (contains(neighborChord.chordPcs, chord.chordPcs[i])) {
            commonTones.push(pcToName(chord.chordPcs[i], false));
        }
    }

    return {
        type: "common-tone-dim7",
        commonTones: commonTones,
        description: "Common-tone diminished 7th (CT\u00b07) — shares " +
                     commonTones.join(", ") + " with " + chordLabel(neighborChord)
    };
}

// ---------------------------------------------------------------------------
//  Enharmonic respelling helper
// ---------------------------------------------------------------------------

// Suggest common enharmonic respellings when notes are spelled unusually.
// tpc: MuseScore tonal pitch class. key: { tonicPc, mode }.
// Returns null or { suggestion, reason }.
function suggestEnharmonic(tpc, key) {
    var name = tpcToName(tpc);
    // Double sharps/flats are often better spelled.
    if (name.indexOf("##") >= 0 || name.indexOf("bb") >= 0) {
        var pc = tpcToPc(tpc);
        var simpler = pcToName(pc, key.mode === "minor");
        if (simpler !== name) {
            return { suggestion: simpler, reason: "Double accidental — consider respelling as " + simpler };
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
//  Phrase structure analysis
// ---------------------------------------------------------------------------

// Detect phrase boundaries based on cadences, then label phrase structures.
// cadences: array of { type, measure } from the cadence classifier.
// Returns { phrases:[], structure } where structure is "period", "sentence",
// "phrase-group", or "unknown".
function analyzePhraseStructure(cadences) {
    if (!cadences || cadences.length === 0) return { phrases: [], structure: "unknown" };

    var phrases = [];
    var prevMeasure = 1;
    for (var i = 0; i < cadences.length; i++) {
        phrases.push({
            startMeasure: prevMeasure,
            endMeasure: cadences[i].measure,
            cadenceType: cadences[i].type
        });
        prevMeasure = cadences[i].measure + 1;
    }

    var structure = "unknown";
    if (phrases.length >= 2) {
        var first = phrases[0];
        var second = phrases[1];
        // Period: HC (antecedent) followed by PAC (consequent).
        if (first.cadenceType === "HC" && second.cadenceType === "PAC") {
            structure = "period";
        } else if (first.cadenceType === "IAC" && second.cadenceType === "PAC") {
            structure = "period";
        } else if (first.cadenceType === "PAC" && second.cadenceType === "PAC") {
            structure = "parallel-period";
        } else {
            structure = "phrase-group";
        }
    } else if (phrases.length === 1) {
        structure = "single-phrase";
    }
    return { phrases: phrases, structure: structure };
}

// ---------------------------------------------------------------------------
//  Counterpoint rules (1st-species style checking)
// ---------------------------------------------------------------------------

// SATB voice ranges (MIDI note numbers).
var VOICE_RANGES = {
    soprano: { low: 60, high: 79 },  // C4 – G5
    alto:    { low: 55, high: 74 },  // G3 – D5
    tenor:   { low: 48, high: 67 },  // C3 – G4
    bass:    { low: 40, high: 60 }   // E2 – C4
};

// Check SATB voice ranges. pitches: array of 4 MIDI numbers [bass, tenor, alto, soprano].
function checkSATBRanges(pitches) {
    var names = ["bass", "tenor", "alto", "soprano"];
    var issues = [];
    if (!pitches || pitches.length < 4) return issues;
    for (var i = 0; i < 4; i++) {
        var range = VOICE_RANGES[names[i]];
        if (pitches[i] < range.low) {
            issues.push({ voice: names[i], pitch: pitches[i], problem: "below-range",
                          description: names[i] + " (" + pitches[i] + ") below range minimum " + range.low });
        }
        if (pitches[i] > range.high) {
            issues.push({ voice: names[i], pitch: pitches[i], problem: "above-range",
                          description: names[i] + " (" + pitches[i] + ") above range maximum " + range.high });
        }
    }
    // Check voice crossing.
    for (var j = 0; j < 3; j++) {
        if (pitches[j] > pitches[j + 1]) {
            issues.push({ voice: names[j] + "/" + names[j + 1], problem: "voice-crossing",
                          description: names[j] + " crosses above " + names[j + 1] });
        }
    }
    // Check spacing: upper voices (S/A, A/T) should be within an octave.
    for (var k = 1; k < 3; k++) {
        if (pitches[k + 1] - pitches[k] > 12) {
            issues.push({ voice: names[k] + "/" + names[k + 1], problem: "spacing",
                          description: "More than an octave between " + names[k] + " and " + names[k + 1] });
        }
    }
    return issues;
}

// Check basic first-species counterpoint rules between two melodic lines.
// melody/counterpoint: arrays of MIDI pitches (same length).
function checkCounterpoint(melody, counterpoint) {
    var issues = [];
    if (!melody || !counterpoint || melody.length < 2) return issues;
    var len = Math.min(melody.length, counterpoint.length);

    for (var i = 0; i < len; i++) {
        var interval = Math.abs(melody[i] - counterpoint[i]) % 12;
        // Unisons only at beginning/end in first species.
        if (interval === 0 && i > 0 && i < len - 1) {
            issues.push({ index: i, type: "unison", description: "Unison in middle of phrase" });
        }
    }
    for (var j = 1; j < len; j++) {
        var prevInt = Math.abs(melody[j - 1] - counterpoint[j - 1]) % 12;
        var currInt = Math.abs(melody[j] - counterpoint[j]) % 12;
        var mDir = melody[j] - melody[j - 1];
        var cDir = counterpoint[j] - counterpoint[j - 1];

        // Parallel perfect intervals.
        if ((currInt === 0 || currInt === 7) && (prevInt === currInt) &&
            ((mDir > 0 && cDir > 0) || (mDir < 0 && cDir < 0))) {
            issues.push({ index: j, type: "parallel-perfect",
                          description: "Parallel perfect interval at beat " + (j + 1) });
        }
        // Direct/hidden 5ths or 8ves.
        if ((currInt === 0 || currInt === 7) &&
            ((mDir > 0 && cDir > 0) || (mDir < 0 && cDir < 0)) &&
            Math.abs(melody[j] - melody[j - 1]) > 2) {
            issues.push({ index: j, type: "direct-perfect",
                          description: "Direct motion to perfect interval at beat " + (j + 1) });
        }
    }
    return issues;
}

// Detect cross-relations (false relations) between adjacent chords.
// prevPitchClasses, currPitchClasses: arrays of pc (0-11).
function detectCrossRelations(prevPcs, currPcs) {
    var results = [];
    if (!prevPcs || !currPcs) return results;
    // Chromatic pc pairs that represent cross-relations (same letter, different accidental).
    // Map each pc to its "natural" letter: C=0/1, D=1/2, E=3/4, F=4/5, G=6/7, A=8/9, B=10/11.
    // For sharps (right side): pc maps to letter below. For flats (left side): pc maps to letter above.
    // We check BOTH possible letter assignments for black keys.
    var pcLetterSharp = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // sharp interpretation
    var pcLetterFlat  = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6]; // flat interpretation
    for (var i = 0; i < prevPcs.length; i++) {
        for (var j = 0; j < currPcs.length; j++) {
            var p1 = mod(prevPcs[i], 12);
            var p2 = mod(currPcs[j], 12);
            if (p1 === p2) continue;
            var diff = Math.abs(p1 - p2);
            if (diff !== 1 && diff !== 11) continue;
            // Check if they could map to the same letter under any enharmonic interpretation.
            var sameLetter = (pcLetterSharp[p1] === pcLetterSharp[p2]) ||
                             (pcLetterSharp[p1] === pcLetterFlat[p2]) ||
                             (pcLetterFlat[p1] === pcLetterSharp[p2]) ||
                             (pcLetterFlat[p1] === pcLetterFlat[p2]);
            if (sameLetter) {
                var name1 = pcToName(p1, false);
                var name2 = pcToName(p2, true); // Use flats for the second to get "Bb" not "A#".
                results.push({
                    pc1: p1, pc2: p2,
                    name1: name1, name2: name2,
                    description: "Cross-relation: " + name1 + " → " + name2
                });
            }
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
//  Melodic contour analysis
// ---------------------------------------------------------------------------

// Analyse the melodic contour of a pitch sequence.
// pitches: array of MIDI note numbers.
function analyzeMelodicContour(pitches) {
    if (!pitches || pitches.length < 2) return null;
    var low = pitches[0], high = pitches[0], lowIdx = 0, highIdx = 0;
    var intervals = [];
    var directions = [];
    var leapCount = 0, stepCount = 0, repeatCount = 0;

    for (var i = 0; i < pitches.length; i++) {
        if (pitches[i] < low) { low = pitches[i]; lowIdx = i; }
        if (pitches[i] > high) { high = pitches[i]; highIdx = i; }
        if (i > 0) {
            var diff = pitches[i] - pitches[i - 1];
            intervals.push(diff);
            if (diff > 0) directions.push("up");
            else if (diff < 0) directions.push("down");
            else directions.push("same");
            var absDiff = Math.abs(diff);
            if (absDiff === 0) repeatCount++;
            else if (absDiff <= 2) stepCount++;
            else leapCount++;
        }
    }

    var range = high - low;
    // Tessitura: middle 50% of notes.
    var sorted = pitches.slice().sort(function (a, b) { return a - b; });
    var q1 = sorted[Math.floor(sorted.length * 0.25)];
    var q3 = sorted[Math.floor(sorted.length * 0.75)];

    // Contour classification.
    var contour = "undulating";
    if (highIdx <= pitches.length * 0.33) contour = "descending-arch";
    else if (highIdx >= pitches.length * 0.67) contour = "ascending";
    else if (lowIdx <= pitches.length * 0.33 && highIdx >= pitches.length * 0.67) contour = "ascending";
    else if (highIdx > pitches.length * 0.25 && highIdx < pitches.length * 0.75) contour = "arch";

    var total = leapCount + stepCount + repeatCount;
    return {
        range: range,
        low: low, high: high,
        lowIndex: lowIdx, highIndex: highIdx,
        tessitura: { low: q1, high: q3 },
        climaxIndex: highIdx,
        contour: contour,
        leapPercent: total > 0 ? Math.round(leapCount / total * 100) : 0,
        stepPercent: total > 0 ? Math.round(stepCount / total * 100) : 0,
        intervals: intervals,
        directions: directions
    };
}

// ---------------------------------------------------------------------------
//  Texture classification
// ---------------------------------------------------------------------------

// Classify the texture of a passage.
// events: array of { pitchClasses, pitches, ... }.
function classifyTexture(events) {
    if (!events || events.length === 0) return "silent";

    var totalVoices = 0;
    var singleVoiceCount = 0;
    var rhythmicUniformity = 0;

    for (var i = 0; i < events.length; i++) {
        var nv = (events[i].pitches || events[i].pitchClasses || []).length;
        totalVoices += nv;
        if (nv === 1) singleVoiceCount++;
        // Check if all voices share same rhythm (simplified: same tick/duration).
        if (nv > 1) rhythmicUniformity++;
    }

    var avgVoices = totalVoices / events.length;
    var singleRatio = singleVoiceCount / events.length;

    if (singleRatio > 0.8) return "monophonic";
    if (avgVoices >= 2 && rhythmicUniformity / events.length > 0.7) return "homophonic";
    if (avgVoices >= 2) return "polyphonic";
    return "mixed";
}

// ---------------------------------------------------------------------------
//  Form detection (simple heuristic)
// ---------------------------------------------------------------------------

// Detect basic musical form from cadence and key data.
// sections: array of { startMeasure, endMeasure, key, cadenceType }.
function detectForm(sections) {
    if (!sections || sections.length === 0) return { form: "unknown", description: "No sections provided." };
    if (sections.length === 1) return { form: "one-part", description: "Single section." };

    var firstKey = sections[0].key ? sections[0].key.tonicPc : -1;
    var lastKey = sections[sections.length - 1].key ? sections[sections.length - 1].key.tonicPc : -1;
    var returnsToHome = (firstKey === lastKey);

    if (sections.length === 2) {
        if (returnsToHome) return { form: "binary-rounded", description: "Two sections, returns to home key." };
        return { form: "binary", description: "Two sections (A–B)." };
    }

    if (sections.length === 3) {
        var midKey = sections[1].key ? sections[1].key.tonicPc : -1;
        if (firstKey === lastKey && midKey !== firstKey) {
            return { form: "ternary", description: "A–B–A form (three sections, first/last share key)." };
        }
        if (firstKey === lastKey && midKey === firstKey) {
            return { form: "strophic", description: "Three sections in same key." };
        }
    }

    // Check for rondo patterns (A B A C A...).
    var homeAppearances = 0;
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].key && sections[i].key.tonicPc === firstKey) homeAppearances++;
    }
    if (homeAppearances >= 3 && sections.length >= 5) {
        return { form: "rondo", description: "Rondo-like (home key returns " + homeAppearances + " times)." };
    }

    if (returnsToHome) {
        return { form: "rounded", description: sections.length + " sections, returns to home key." };
    }
    return { form: "through-composed", description: sections.length + " sections, no key return." };
}

// ---------------------------------------------------------------------------
//  Cadential 6/4 detection
// ---------------------------------------------------------------------------

// Detect cadential 6/4 chords (I6/4 preceding V at cadences).
// Returns info if the chord is a cadential 6/4 in context.
function detectCadential64(chord, nextChord, key) {
    if (!chord || !nextChord || !key) return null;
    // Cadential 6/4: root = tonic (I), second inversion (6/4 = inversion 2),
    // followed by V or V7.
    if (chord.rootPc !== key.tonicPc) return null;
    if (chord.inversion !== 2) return null;

    var nextDegree = mod(nextChord.rootPc - key.tonicPc, 12);
    if (nextDegree !== 7) return null; // Must resolve to V.

    return {
        type: "cadential-64",
        description: "Cadential 6/4 (I64 → V) in " + keyName(key),
        resolvedTo: chordLabel(nextChord)
    };
}

// ---------------------------------------------------------------------------
//  Twelve-tone / serial analysis
// ---------------------------------------------------------------------------

// Given a twelve-tone row (array of 12 pitch classes), compute all basic transformations.
function computeRowForms(row) {
    if (!row || row.length !== 12) return null;

    var P0 = [];
    for (var i = 0; i < 12; i++) P0.push(mod(row[i], 12));

    // Inversion: invert intervals from first note.
    var I0 = [P0[0]];
    for (var j = 1; j < 12; j++) {
        I0.push(mod(P0[0] - (P0[j] - P0[0]), 12));
    }

    // Retrograde.
    var R0 = P0.slice().reverse();

    // Retrograde-Inversion.
    var RI0 = I0.slice().reverse();

    // Generate all transpositions.
    var matrix = { P: [], I: [], R: [], RI: [] };
    for (var t = 0; t < 12; t++) {
        matrix.P[t] = [];
        matrix.I[t] = [];
        matrix.R[t] = [];
        matrix.RI[t] = [];
        for (var n = 0; n < 12; n++) {
            matrix.P[t].push(mod(P0[n] + t, 12));
            matrix.I[t].push(mod(I0[n] + t, 12));
            matrix.R[t].push(mod(R0[n] + t, 12));
            matrix.RI[t].push(mod(RI0[n] + t, 12));
        }
    }

    return { P0: P0, I0: I0, R0: R0, RI0: RI0, matrix: matrix };
}

// Check if a sequence of pitch classes matches any row form.
// row: the original 12-tone row, pcs: sequence to check.
function findRowForm(row, pcs) {
    if (!row || !pcs || pcs.length < 3) return null;
    var forms = computeRowForms(row);
    if (!forms) return null;

    var types = ["P", "I", "R", "RI"];
    for (var ti = 0; ti < types.length; ti++) {
        for (var t = 0; t < 12; t++) {
            var rowForm = forms.matrix[types[ti]][t];
            var match = true;
            for (var i = 0; i < pcs.length && i < 12; i++) {
                if (mod(pcs[i], 12) !== rowForm[i]) { match = false; break; }
            }
            if (match) {
                return { type: types[ti], transposition: t, label: types[ti] + t };
            }
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
//  Chord-scale theory (jazz)
// ---------------------------------------------------------------------------

// For a given chord, suggest compatible scales.
var CHORD_SCALE_MAP = {
    "maj":    ["ionian", "lydian"],
    "min":    ["dorian", "aeolian", "phrygian"],
    "7":      ["mixolydian", "lydian-dominant"],
    "maj7":   ["ionian", "lydian"],
    "min7":   ["dorian", "aeolian"],
    "m7b5":   ["locrian", "locrian-natural-2"],
    "dim7":   ["whole-half-diminished"],
    "dim":    ["whole-half-diminished"],
    "aug":    ["whole-tone", "lydian-augmented"],
    "aug7":   ["whole-tone", "altered"],
    "min6":   ["dorian", "melodic-minor"],
    "6":      ["ionian", "lydian"],
    "sus4":   ["mixolydian"],
    "7sus4":  ["mixolydian"],
    "9":      ["mixolydian"],
    "maj9":   ["ionian", "lydian"],
    "min9":   ["dorian", "aeolian"],
    "minMaj7": ["melodic-minor"]
};

function suggestChordScales(chord) {
    if (!chord) return [];
    var scales = CHORD_SCALE_MAP[chord.quality] || [];
    var result = [];
    for (var i = 0; i < scales.length; i++) {
        result.push({ scaleName: scales[i], rootPc: chord.rootPc,
                      rootName: pcToName(chord.rootPc, false) });
    }
    return result;
}

// ---------------------------------------------------------------------------
//  Harmonic tension mapping
// ---------------------------------------------------------------------------

// Assign a tension score to each event based on dissonance and chromatic content.
function computeHarmonicTension(events, key) {
    var results = [];
    for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        var chord = ev.chord || identifyChord(ev.pitchClasses || [], ev.bassPc);
        var tension = 0;

        if (chord) {
            // Dissonance from chord type.
            if (chord.quality === "dim7" || chord.quality === "m7b5") tension += 4;
            else if (chord.quality === "dim" || chord.quality === "aug") tension += 3;
            else if (chord.quality === "7" || chord.quality === "aug7") tension += 2;
            else if (chord.quality === "min7" || chord.quality === "maj7") tension += 1;

            // Chromatic content.
            if (key && chordIsChromatic(chord, key)) tension += 2;

            // Extras (non-chord tones in the sonority).
            tension += (chord.extras || 0);

            // Inversion adds mild tension.
            if (chord.inversion > 0) tension += chord.inversion * 0.5;
        } else {
            tension = 3; // Unrecognised sonority is moderately tense.
        }

        results.push({
            measure: ev.measure || 1,
            tick: ev.tick,
            tension: Math.round(tension * 10) / 10,
            chord: chord ? chordLabel(chord) : "?"
        });
    }
    return results;
}

// ---------------------------------------------------------------------------
//  Augmented sixth chord classification (detailed types)
// ---------------------------------------------------------------------------

// Classify augmented 6th chords: Italian (It+6), French (Fr+6), German (Ger+6).
function classifyAugmentedSixth(chordOrPcs, key) {
    if (!chordOrPcs || !key) return null;
    var pcs;
    if (Array.isArray(chordOrPcs)) {
        pcs = chordOrPcs;
    } else {
        pcs = chordOrPcs.chordPcs || [];
    }
    if (pcs.length < 3) return null;

    // The augmented 6th interval is between b6 and #4 of the key.
    var b6 = mod(key.tonicPc + 8, 12); // flat 6 in major
    var sharp4 = mod(key.tonicPc + 6, 12); // raised 4 / enharmonic to b5

    if (!contains(pcs, b6) || !contains(pcs, sharp4)) return null;

    var tonic = key.tonicPc;
    var hasOne = contains(pcs, tonic);
    var hasTwo = contains(pcs, mod(tonic + 2, 12));
    var hasThree = contains(pcs, mod(tonic + (key.mode === "minor" ? 3 : 4), 12));

    if (hasOne && !hasTwo && pcs.length === 3) {
        return { type: "It+6", description: "Italian augmented sixth (It+6)" };
    }
    if (hasTwo && pcs.length >= 4) {
        return { type: "Fr+6", description: "French augmented sixth (Fr+6)" };
    }
    if (hasThree && pcs.length >= 4) {
        return { type: "Ger+6", description: "German augmented sixth (Ger+6)" };
    }
    if (hasOne && pcs.length >= 4) {
        return { type: "Ger+6", description: "German augmented sixth (Ger+6)" };
    }

    return { type: "Aug6", description: "Augmented sixth chord (unclassified)" };
}

// ---------------------------------------------------------------------------
//  Parallel / planing detection
// ---------------------------------------------------------------------------

// Detect parallel chord motion (planing): consecutive chords of the same quality
// moving by the same interval.
function detectPlaning(events, minLength) {
    var results = [];
    if (!events || events.length < 3) return results;
    if (!minLength) minLength = 3;

    // Resolve chords.
    var chords = [];
    for (var i = 0; i < events.length; i++) {
        chords.push(events[i].chord || identifyChord(events[i].pitchClasses || [], events[i].bassPc));
    }

    var runStart = 0;
    for (var j = 2; j < chords.length; j++) {
        if (!chords[j] || !chords[j - 1] || !chords[j - 2]) { runStart = j; continue; }
        var q1 = chords[j - 2].quality;
        var q2 = chords[j - 1].quality;
        var q3 = chords[j].quality;
        var int1 = mod(chords[j - 1].rootPc - chords[j - 2].rootPc, 12);
        var int2 = mod(chords[j].rootPc - chords[j - 1].rootPc, 12);

        if (q1 === q2 && q2 === q3 && int1 === int2 && int1 !== 0) {
            // Part of a planing run.
        } else {
            var runLen = j - runStart;
            if (runLen >= minLength && runStart < j - 1) {
                results.push({
                    startIndex: runStart, endIndex: j - 1,
                    quality: chords[runStart].quality,
                    interval: mod(chords[runStart + 1].rootPc - chords[runStart].rootPc, 12),
                    startMeasure: events[runStart].measure || 1,
                    endMeasure: events[j - 1].measure || 1,
                    description: "Planing: " + (j - runStart) + " " + chords[runStart].quality +
                                 " chords in parallel motion"
                });
            }
            runStart = j - 1;
        }
    }
    // Check final run.
    var finalLen = chords.length - runStart;
    if (finalLen >= minLength && runStart < chords.length - 1 &&
        chords[runStart] && chords[runStart + 1]) {
        results.push({
            startIndex: runStart, endIndex: chords.length - 1,
            quality: chords[runStart].quality,
            interval: mod(chords[runStart + 1].rootPc - chords[runStart].rootPc, 12),
            startMeasure: events[runStart].measure || 1,
            endMeasure: events[chords.length - 1].measure || 1,
            description: "Planing: " + finalLen + " " + chords[runStart].quality +
                         " chords in parallel motion"
        });
    }

    return results;
}

// ---------------------------------------------------------------------------
//  Hemiola detection
// ---------------------------------------------------------------------------

// Detect hemiola: a rhythmic device where 3×2 becomes 2×3 or vice versa.
// durations: array of tick durations for consecutive notes.
// beatsPerMeasure: the meter numerator.
function detectHemiola(durations, beatsPerMeasure) {
    var results = [];
    if (!durations || durations.length < 4 || !beatsPerMeasure) return results;

    // In 3/4 time, a hemiola groups six eighth notes as 3 groups of 2 instead of 2 groups of 3.
    // In 6/8, hemiola groups as 3+3 instead of 2+2+2.
    // We look for consistent durations that form the "other" grouping.
    var ticksPerBeat = 480; // Standard MIDI quarter note.
    var measureTicks = ticksPerBeat * beatsPerMeasure;

    for (var i = 0; i < durations.length - 2; i++) {
        // Look for 3 equal durations that together span a different grouping than the meter.
        if (durations[i] === durations[i + 1] && durations[i + 1] === durations[i + 2]) {
            var groupTicks = durations[i] * 3;
            // If the 3-group crosses the normal beat grouping.
            if (beatsPerMeasure === 3 && durations[i] === ticksPerBeat * 2 / 3) {
                results.push({ startIndex: i, length: 3, type: "hemiola-3-to-2",
                               description: "Hemiola: 3 groups of 2 in triple meter" });
            } else if (beatsPerMeasure === 6 && groupTicks === measureTicks) {
                results.push({ startIndex: i, length: 3, type: "hemiola-2-to-3",
                               description: "Hemiola: 2 groups of 3 in compound meter" });
            }
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
//  Linear intervallic patterns (LIPs)
// ---------------------------------------------------------------------------

// Detect linear intervallic patterns (e.g., 10-10, 6-6, 10-6 alternating)
// between two voice lines.
// upperPitches, lowerPitches: arrays of MIDI pitches (same length).
function detectLinearIntervallic(upperPitches, lowerPitches, minLength) {
    var results = [];
    if (!upperPitches || !lowerPitches) return results;
    var len = Math.min(upperPitches.length, lowerPitches.length);
    if (len < 3) return results;
    if (!minLength) minLength = 3;

    // Compute intervals (mod 12, but keep compound sense).
    var intervals = [];
    for (var i = 0; i < len; i++) {
        intervals.push(mod(upperPitches[i] - lowerPitches[i], 12));
    }

    // Look for repeated single-interval patterns (e.g., all 10ths = interval 10 mod 12 → 10 or 3).
    var runStart = 0;
    for (var j = 1; j <= intervals.length; j++) {
        if (j < intervals.length && intervals[j] === intervals[runStart]) continue;
        var runLen = j - runStart;
        if (runLen >= minLength) {
            var ivName = intervals[runStart];
            results.push({
                startIndex: runStart, endIndex: j - 1, length: runLen,
                pattern: ivName + "-" + ivName,
                description: "LIP: parallel " + ivName + "ths (" + runLen + " beats)"
            });
        }
        runStart = j;
    }

    // Look for alternating patterns (e.g., 10-6-10-6).
    if (intervals.length >= 4) {
        var altStart = 0;
        for (var k = 2; k <= intervals.length; k++) {
            var matches = (k < intervals.length &&
                          intervals[k] === intervals[k - 2]);
            if (!matches) {
                var altLen = k - altStart;
                if (altLen >= minLength && intervals[altStart] !== intervals[altStart + 1]) {
                    results.push({
                        startIndex: altStart, endIndex: k - 1, length: altLen,
                        pattern: intervals[altStart] + "-" + intervals[altStart + 1],
                        description: "LIP: alternating " + intervals[altStart] + "-" +
                                     intervals[altStart + 1] + " (" + altLen + " beats)"
                    });
                }
                altStart = k - 1;
            }
        }
    }

    return results;
}

// ---------------------------------------------------------------------------
//  Extended colors for new features
// ---------------------------------------------------------------------------

var COLORS_EXT2 = {
    counterpoint: "#880e4f",  // dark pink
    contour: "#1a237e",       // indigo
    texture: "#004d40",       // dark teal
    form: "#311b92",          // deep purple
    serial: "#bf360c",        // deep orange
    chordScale: "#0d47a1",    // blue
    tension: "#e65100",       // orange
    aug6: "#ad1457",          // pink
    planing: "#00695c",       // teal green
    crossRelation: "#d50000", // red
    cadential64: "#2e7d32",   // green
    lip: "#5d4037"            // brown
};

// ---------------------------------------------------------------------------
//  Enhanced aggregate analysis (add new detections to analyzeProgression)
// ---------------------------------------------------------------------------

var COLORS_EXT = {
    modulation: "#6a1b9a",   // deep purple
    sequence: "#00838f",     // teal
    pedal: "#4e342e",        // brown
    tritone: "#c62828",      // red
    tendency: "#1b5e20",     // dark green
    dim7ct: "#ff6f00"        // amber
};

// Node.js interop (ignored by the QML engine)
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
        COLORS: COLORS,
        // New exports
        detectModulations: detectModulations,
        findPivotChord: findPivotChord,
        detectSequences: detectSequences,
        detectPedalPoints: detectPedalPoints,
        classifyPedalType: classifyPedalType,
        analyzeHarmonicRhythm: analyzeHarmonicRhythm,
        checkTendencyTones: checkTendencyTones,
        classifyTritoneSub: classifyTritoneSub,
        classifyMotion: classifyMotion,
        analyzeMotionTypes: analyzeMotionTypes,
        checkHiddenIntervals: checkHiddenIntervals,
        analyzeVoicing: analyzeVoicing,
        normalForm: normalForm,
        primeForm: primeForm,
        intervalVector: intervalVector,
        formatPcSet: formatPcSet,
        forteName: forteName,
        FORTE_NAMES: FORTE_NAMES,
        classifyCommonToneDim7: classifyCommonToneDim7,
        suggestEnharmonic: suggestEnharmonic,
        analyzePhraseStructure: analyzePhraseStructure,
        COLORS_EXT: COLORS_EXT,
        // Phase 2 exports
        VOICE_RANGES: VOICE_RANGES,
        checkSATBRanges: checkSATBRanges,
        checkCounterpoint: checkCounterpoint,
        detectCrossRelations: detectCrossRelations,
        analyzeMelodicContour: analyzeMelodicContour,
        classifyTexture: classifyTexture,
        detectForm: detectForm,
        detectCadential64: detectCadential64,
        computeRowForms: computeRowForms,
        findRowForm: findRowForm,
        CHORD_SCALE_MAP: CHORD_SCALE_MAP,
        suggestChordScales: suggestChordScales,
        computeHarmonicTension: computeHarmonicTension,
        classifyAugmentedSixth: classifyAugmentedSixth,
        detectPlaning: detectPlaning,
        detectHemiola: detectHemiola,
        detectLinearIntervallic: detectLinearIntervallic,
        COLORS_EXT2: COLORS_EXT2
    };
}
