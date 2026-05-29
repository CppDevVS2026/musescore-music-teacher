# Theory engine API (`MusicTeacher/theory.js`)

Pure, dependency-free music-theory functions. Pitch classes (`pc`) are `0..11`
(C = 0). MuseScore tonal pitch classes (`tpc`) are `-1..33`. MIDI pitches are the
usual `0..127`.

## Pitch & naming
- `tpcToPc(tpc)` → `pc` — convert a MuseScore tonal pitch class to a pitch class.
- `tpcToName(tpc)` → `"C" | "F#" | "Bb" | ...` — spelled note name from a tpc.
- `pcToName(pc, preferFlats)` → spelled name; `preferFlats` picks flat spellings.

## Chords
- `identifyChord(pitchClasses, bassPc)` → `{ rootPc, quality, symbol, triad,
  intervals, inversion, bassPc, chordPcs, extras } | null`.
  Template-matches triads and sevenths (maj, min, dim, aug, sus, 7, maj7, min7,
  m7b5, dim7, minMaj7), tolerating a single extra (passing) tone and using the bass
  to disambiguate symmetric chords.
- `chordLabel(chord)` → `"C" | "Am" | "G7" | "B°7"`.

## Key
- `detectKey(pcHistogram, keyHint?)` → `{ tonicPc, mode, confidence }`.
  Krumhansl-Schmuckler correlation over a 12-slot duration histogram. `keyHint`
  may be `{ fifths }` (signature) or `{ tonicPc, mode }`; the matching key (and its
  relative) is lightly favoured.
- `keyName(key)` → `"C major" | "A minor"`.

## Roman numerals & function
- `romanNumeral(chord, key)` → `{ roman, degree, accidental, isChromatic,
  inversionFigure, function }`.
- `scaleDegree(pc, key)` → `1..7` (or `0` if chromatic).
- `isDiatonic(pc, key)` → `bool`.
- `chordIsChromatic(chord, key)` → `bool`.

## Relationships / classifiers
- `classifyMediant(a, b)` → `{ type, commonTones, sameQuality, description } | null`
  where `type ∈ {diatonic-mediant, chromatic-mediant, doubly-chromatic-mediant}`.
- `classifySecondaryDominant(a, b, key)` → `{ label:"V7/V", targetRoman, ... } | null`.
- `classifyBorrowed(chord, key)` → `[{ name, description }]` (Neapolitan, augmented
  sixth, modal mixture, Picardy ...).
- `classifyCadence(prev, last, sopranoPcPrev, sopranoPcLast, key)` →
  `{ type:"PAC|IAC|HC|DC|PC", description } | null`.

## Melody / voice leading
- `intervalBetween(lowPitch, highPitch)` → `{ semitones, simpleSemitones, name,
  longName, consonant, perfect }`.
- `identifyScale(pitchClasses, tonicPc)` → `[{ name, exact, size }]` (sorted, exact
  fits first); covers the diatonic modes, melodic/harmonic minor, pentatonics, blues,
  whole-tone and chromatic.
- `classifyNonChordTone(prevPitch, pitch, nextPitch, chordPcs)` →
  `{ type, description } | null` (`passing | neighbor | suspension | appoggiatura |
  escape | anticipation | unprepared`).
- `checkVoiceLeading(prevVoices, currVoices)` → `[{ type, voices:[i,j], description }]`
  for parallel fifths/octaves; voices are ascending MIDI pitch arrays.

## Aggregate
- `analyzeProgression(events, keyHint?)` → `{ key, items:[{ tick, measure, kind,
  text, color, anchorTick }] }`. `kind ∈ {roman, mediant, secondary, borrowed,
  cadence}`. Drives the **Harmony Analysis** plugin.
- `COLORS` — category → hex colour map used for note colouring and callouts.

## Data flow (per analysis plugin)

```
collectEvents(curScore, Element)         // mscore.js: vertical sonorities per onset
        │  events:[{tick, pitches, pitchClasses, bassPc, sopranoPc, notes, measure}]
        ▼
keySignatureHint(curScore)  ──►  detectKey(histogram, hint)      // theory.js
        ▼
identifyChord(...) per event  ──►  romanNumeral / classify*(...)  // theory.js
        ▼
analyzeProgression(...)  ──►  items[]                              // theory.js
        ▼
curScore.startCmd()
addText(...) + colorEventNotes(...)   per item                    // mscore.js
curScore.endCmd()
```
