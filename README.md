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
  voice-leading problems **red**.
- The analysis plugins modify the score (inside a single undo step) — press
  **Ctrl+Z** to remove all annotations at once.

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
