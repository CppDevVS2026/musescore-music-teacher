# MuseScore Music Teacher

A suite of **MuseScore 3 & 4** plugins that turn the score editor into a music-theory
teaching assistant — and a set of **focus-friendly practice aids** designed with
ADHD/attention support in mind.

The plugins "point things out" on the score: Roman numerals, chromatic mediants,
secondary dominants, borrowed chords, cadences, voice-leading problems, scales/modes,
and non-chord tones — all annotated directly onto the music with text and colour.

## Why two layers?

All music theory lives in a single, framework-free engine (`MusicTeacher/theory.js`)
that has **no MuseScore dependencies** and is covered by Node unit tests. The thin
`MusicTeacher/mscore.js` layer is the only code that touches the MuseScore object
model (cursors, segments, notes). The `.qml` files are small entry points that wire
the two together and draw a panel.

```
MusicTeacher/
  theory.js        pure theory engine (tested under Node)
  mscore.js        MuseScore API glue: traversal + annotation
  analysis.qml             Harmony Analysis  (Roman numerals + all callouts)
  chromaticMediants.qml    Chromatic Mediant Finder
  cadences.qml             Cadence Finder
  voiceLeading.qml         Voice-Leading Checker (parallel 5ths/8ves)
  scaleExplorer.qml        Scale & Interval Explorer (read-only)
  nonChordTones.qml        Non-Chord-Tone Highlighter (top voice)
  modulationDetector.qml   Modulation & Tonicization Detector
  sequenceDetector.qml     Harmonic Sequence Finder
  harmonicRhythm.qml       Harmonic Rhythm / Pedal Points / Tritone Subs
  tendencyTones.qml        Tendency Tone Resolution Checker
  motionAnalysis.qml       Motion Type & Hidden 5ths/8ves Analyzer
  chordVoicing.qml         Chord Voicing & Spacing Analyzer
  setClassAnalysis.qml     Pitch-Class Set / Forte Analysis (post-tonal)
  counterpointChecker.qml  Counterpoint & SATB Range Checker
  melodicContour.qml       Melodic Contour Analyzer
  formAnalysis.qml         Form & Texture Analyzer
  serialAnalysis.qml       Twelve-Tone / Serial Analysis
  chordScales.qml          Chord-Scale Suggester (jazz) + Tension Map
  planingDetector.qml      Planing & Linear Intervallic Patterns
  secondaryChains.qml      Secondary Dominant Chains & Applied Network
  modeMixture.qml           Mode Mixture & Prolongation Analyzer
  rhythmAnalysis.qml        Rhythm & Syncopation Analyzer
  reductionAnalysis.qml     Reduction & Structural Analysis
  sightReadingDifficulty.qml Sight-Reading Difficulty Scorer
  theoryDrills.qml          Theory Drill Generator (intervals/chords/scales)
  errorDiagnosis.qml        Error Diagnosis & Teaching Feedback
  guidedAnalysis.qml        Guided Analysis Walkthrough
  practiceChunker.qml      Practice Chunker        (focus aid)
  focusTimer.qml           Focus Practice Timer    (focus aid)
  colorCoding.qml          Color Coding            (focus aid)
  practiceChecklist.qml    Practice Checklist      (focus aid)
test/
  theory.test.js   unit tests for the engine
```

## Plugins

### Theory / analysis

| Plugin | What it does |
| --- | --- |
| **Harmony Analysis** | Detects the key, writes a Roman numeral under every chord, and adds colour-coded callouts for chromatic mediants, secondary dominants, borrowed/mixture chords, Neapolitan & augmented-sixth chords, and cadences. |
| **Chromatic Mediant Finder** | Flags chromatic (1 common tone) and doubly-chromatic (0 common tones) mediant moves; lists diatonic mediants for contrast. |
| **Cadence Finder** | Labels PAC, IAC, half, deceptive and plagal cadences. |
| **Voice-Leading Checker** | Flags parallel perfect fifths and octaves between voices. |
| **Scale & Interval Explorer** | Read-only: detected key, pitch inventory, which scales/modes fit, and the melodic intervals of the top voice. |
| **Non-Chord-Tone Highlighter** | Labels passing tones, neighbors, suspensions, appoggiaturas, escape tones and anticipations in the top voice. |
| **Modulation Detector** | Windowed key detection to identify key regions across a piece, labels modulation points and pivot chords (chords diatonic in both old and new key). |
| **Sequence Detector** | Finds repeated harmonic patterns — circle-of-fifths, stepwise, and third-based sequences — in the chord root progression. |
| **Harmonic Rhythm** | Measures chord-change rate per measure, detects pedal points (sustained bass with changing harmony), and flags tritone substitutions. |
| **Tendency Tones** | Checks whether leading tones resolve up to the tonic and chordal 7ths resolve down by step; flags unresolved tendency tones in red. |
| **Motion Analysis** | Classifies voice motion between all pairs (parallel, similar, contrary, oblique) and detects hidden (direct) fifths and octaves. |
| **Chord Voicing** | Analyses open/close position, spacing between upper voices, doublings, and common-tone diminished 7th chords (CT°7). |
| **Set-Class Analysis** | Post-tonal pitch-class set theory: computes normal form, prime form, interval vector, and Forte set-class name for each vertical sonority. |
| **Counterpoint Checker** | Checks first-species counterpoint rules, SATB voice ranges (crossing, spacing), and cross-relations (false relations) between adjacent chords. |
| **Melodic Contour** | Analyses the top voice melody: range, tessitura, climax point, contour type (arch, ascending, descending-arch), and leap/step percentages. |
| **Form & Texture** | Detects musical form (binary, ternary, rondo, through-composed) from key regions and cadences; classifies texture (monophonic/homophonic/polyphonic); detects cadential 6/4 chords. |
| **Serial Analysis** | Twelve-tone row analysis: derives P0 from the first 12 distinct pitch classes, computes all 48 row forms (P/I/R/RI × 12 transpositions), searches the score for row-form matches. |
| **Chord-Scale Suggester** | Jazz chord-scale theory: suggests compatible scales for each chord (ionian, dorian, mixolydian, etc.), maps harmonic tension across the piece, and classifies augmented sixth chords (It+6, Fr+6, Ger+6). |
| **Planing & LIP Detector** | Detects parallel chord motion (planing/parallelism), linear intervallic patterns (10-10, 6-6, alternating), and hemiola rhythmic patterns. |
| **Secondary Chains** | Traces chains of secondary dominants (V/x → x → …) and builds an applied-chord network showing which scale degrees are targeted by applied chords. |
| **Mode Mixture** | Mode mixture catalog (borrowed chords from parallel minor: iv, bVI, bVII, etc.), prolongation patterns (neighbor/passing embellishments), and chord substitution classification. |
| **Rhythm Analysis** | Syncopation detection (weak-beat attacks sustaining through strong beats), metric displacement analysis, and voice independence scoring (contrary/oblique/similar/parallel motion ratios). |
| **Reduction Analysis** | Structural tone identification (chord tones vs embellishments), aggregate completion tracking (12-tone saturation), voice-leading efficiency measurement, melodic interval-class content, and harmonic function distribution (T/S/D percentages). |
| **Sight-Reading Difficulty** | Scores passage difficulty 1–10 based on range, chromaticism, leap frequency, and voice count. Generates targeted practice tips (break into chunks, isolate leaps, practice diatonic skeleton first). |
| **Theory Drills** | Interactive drill generator: interval identification, chord identification, scale identification, Roman numeral labeling, and cadence recognition. Each drill shows the question, then reveals the answer on click. |
| **Error Diagnosis** | Diagnoses voice-leading errors (parallel 5ths/8ves, voice crossing, spacing) and common student mistakes (doubled leading tone, missing root) with detailed pedagogical explanations and fix suggestions. Includes scale-degree ear-training hints (solfège, character descriptions). |
| **Guided Analysis** | Step-by-step guided analysis walkthrough: (1) identify key, (2) label Roman numerals, (3) find non-chord tones, (4) identify cadences, (5) check voice leading, (6) analyze harmonic function. Navigate forward/backward through steps. |

### Focus / ADHD practice aids

| Plugin | What it does |
| --- | --- |
| **Practice Chunker** | Breaks the piece into small numbered chunks (choose the size) so you practise one achievable section at a time instead of facing the whole page. |
| **Focus Practice Timer** | A Pomodoro-style timer that alternates focused practice and short breaks with a large, low-distraction countdown. |
| **Color Coding** | Colours noteheads by pitch class (same letter = same colour) or by scale degree to reduce reading load. One-click reset. |
| **Practice Checklist** | Generates a tickable, section-by-section practice plan with suggested steps and live progress feedback. |

## Installing

1. Copy the `MusicTeacher/` folder into your MuseScore plugins directory:
   - **Windows:** `%HOMEPATH%\Documents\MuseScore4\Plugins\` (or `MuseScore3`)
   - **macOS:** `~/Documents/MuseScore4/Plugins/`
   - **Linux:** `~/Documents/MuseScore4/Plugins/`
2. Open MuseScore and go to **Home → Plugins** (MuseScore 4) or **Plugins → Plugin
   Manager** (MuseScore 3) and enable the plugins you want.
3. Run them from the **Plugins → Music Teacher** menu with a score open.

## Notes & colours

- Roman numerals are placed **below** the staff; teaching callouts are placed **above**.
- Flagged chords have their noteheads coloured by category: mediants **purple**,
  secondary dominants **blue**, mixture/chromatic **orange**, cadences **green**,
  voice-leading problems **red**, modulations **deep purple**, sequences **teal**,
  pedal points **brown**, tritone subs **red**, tendency issues **dark green**,
  CT°7 **amber**, set-class labels **indigo**, counterpoint issues **dark pink**,
  cross-relations **red**, form labels **deep purple**, serial row-forms **deep
  orange**, chord-scales **blue**, tension peaks **orange**, augmented sixths
  **pink**, planing **teal green**, LIPs **brown**, secondary chains **purple**,
  mode mixture **amber-yellow**, prolongation **olive**, syncopation **pink**,
  voice independence **cyan**, structural tones **amber**, aggregate **dark green**,
  teaching errors **red**, teaching hints **green**, guided analysis **deep purple**.
- The analysis plugins modify the score (inside a single undo step) — press
  **Ctrl+Z** to remove all annotations at once.

## Templates

The `templates/` folder contains ready-to-use MuseScore score templates:

| Template | Description |
| --- | --- |
| **Mass_SATB_Organ.mscx** | Mass Ordinary (Kyrie, Gloria, Credo, Sanctus, Agnus Dei) for SATB choir and organ. 8 blank measures per movement, section breaks between movements, rehearsal marks, tempo markings, and Latin text references. |

Open a template in MuseScore 3 or 4 and start composing — see
[templates/README.md](templates/README.md) for details.

## Development

The theory engine is plain ES5 (no build step) so the exact same file runs both in
MuseScore's JS engine and under Node.

```bash
npm test      # runs node --test against test/theory.test.js
```

## Compatibility

Targets MuseScore 3.x and 4.x (including 4.4). The plugins avoid `Qt.quit()` on
MuseScore 4 (which crashes the app) and register their MuseScore-4 `title`/
`categoryCode` both via `Component.onCompleted` and the `//4.4` metadata comments.

## License

MIT — see [LICENSE](LICENSE).
