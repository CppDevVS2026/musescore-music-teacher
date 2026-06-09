# Historical Manuscript Style for MuseScore

Make your MuseScore scores look like 18th-century handwritten manuscripts
(Mozart, Beethoven, Haydn era).

![Example: handwritten manuscript notation](../docs/manuscript-example.png)

## What's included

| File | Description |
|------|-------------|
| `HistoricalManuscript.mss` | Full style: Petaluma handwritten font + sepia brown ink + thin quill-pen lines + classical spacing + no measure numbers/footers |

## Quick start (MuseScore 3 or 4)

1. **Load the style:**
   - `Format` → `Load Style...` → select `HistoricalManuscript.mss`
   - All notation and text immediately switches to the manuscript look

2. **Set parchment paper colour** (optional but recommended):
   - `Edit` → `Preferences` → `Canvas` tab
   - Set **Paper colour** to `#F5E6C8` (warm parchment cream)
   - Set **Background** to `#D4C4A0` (darker parchment) or `#C8B896`

3. **Export as PDF** — the sepia ink color and handwritten notation are embedded.

## What the style changes

### Notation font
- **Music symbols:** Petaluma (Steinberg's handwritten SMuFL font, built into MuseScore)
- **Text:** Edwin (MuseScore's elegant serif, in italic where appropriate)

### Ink colour
All text elements use **dark sepia brown** (`rgb(75, 48, 18)` / `#4B3012`) instead of
pure black — simulating iron gall ink on aged paper.

> **Note:** The style file colours _text_ and _frame_ elements. The music notation
> symbols (noteheads, stems, staff lines, clefs, etc.) are drawn by the engine using
> the "default foreground colour" from Preferences — not from the style. To make
> _everything_ sepia, you also need to change the foreground colour in your INI/PLIST
> config file. See "Going deeper" below.

### Line weights
- Staff lines: 0.08sp (thinner than default 0.11 — mimics quill pen)
- Stems: 0.12sp (thinner than default 0.13)
- Barlines: 0.22sp (thinner than default 0.30)
- Slurs: thinner end/mid widths for delicate curves
- Hairpins, ottava lines, glissando: all reduced

### Layout
- Wider margins (classical-era generous white space)
- Greater staff distance (7.5sp)
- Measure numbers hidden
- Headers/footers hidden
- Page numbers hidden

### Chord symbols
- Standard chord style (`chords_std.xml`) instead of jazz
- All chord text in Edwin serif

## Going deeper: full sepia notation

The `.mss` style controls text and layout, but **noteheads, clefs, accidentals, and
staff lines** are drawn using a system-level foreground colour. To make those sepia too:

### Windows / Linux (INI file)
1. Close MuseScore
2. Find your config file:
   - **Windows:** `%LOCALAPPDATA%\MuseScore\MuseScore4.ini`
   - **Linux:** `~/.config/MuseScore/MuseScore4.ini`
3. Find or add under `[ui]`:
   ```ini
   [ui]
   canvas\foregroundColor=#ff4B3012
   canvas\paperColor=#ffF5E6C8
   ```
4. Restart MuseScore

### macOS (PLIST file)
1. Close MuseScore
2. Open Terminal:
   ```bash
   defaults write org.musescore.MuseScore4 ui.canvas.foregroundColor -string "#ff4B3012"
   defaults write org.musescore.MuseScore4 ui.canvas.paperColor -string "#ffF5E6C8"
   ```
3. Restart MuseScore

This makes **all** drawn elements (noteheads, clefs, flags, stems, staff lines) render in
sepia brown, completing the historical manuscript look.

## Upgrade: install a historical calligraphic text font

The style uses "Edwin" (MuseScore's built-in serif) for all text. For a more authentic
18th-century look, install one of these **free** fonts and replace `Edwin` in the `.mss`:

| Font | Style | Where to get it |
|------|-------|-----------------|
| **IM Fell English** | 18th-century Fell types (Horace Hart) | [Google Fonts](https://fonts.google.com/specimen/IM+Fell+English) |
| **IM Fell DW Pica** | Same family, slightly larger | [Google Fonts](https://fonts.google.com/specimen/IM+Fell+DW+Pica) |
| **Sorts Mill Goudy** | Old-style Goudy revival | [Google Fonts](https://fonts.google.com/specimen/Sorts+Mill+Goudy) |
| **Cormorant Garamond** | Elegant old-style serif | [Google Fonts](https://fonts.google.com/specimen/Cormorant+Garamond) |

After installing the font, open `HistoricalManuscript.mss` in a text editor and
find-and-replace `Edwin` with your chosen font name (e.g. `IM Fell English`).

## Upgrade: install the Sebastian music font

For an even more historical engraving look (classic German Urtext style), install the
free **Sebastian** SMuFL font:

1. Download from [github.com/fkretlow/sebastian](https://github.com/fkretlow/sebastian/releases)
2. Install the `.otf` files and place `metadata.json` in:
   - `Documents/MuseScore4/MusicFonts/Sebastian/`
3. Edit the `.mss` and change:
   ```xml
   <musicalSymbolFont>Sebastian</musicalSymbolFont>
   <musicalTextFont>Sebastian Text</musicalTextFont>
   ```

Sebastian gives a classic Peters/Henle Urtext engraving look — not handwritten, but
period-authentic for published 18th/19th-century editions.

## Sibelius alternative

If you use **Sibelius**, you don't need a custom file — Sibelius ships with built-in
handwritten house styles:

1. **Reprise** (closest to historical handcopying):
   - `Appearance` → `House Style` → `Import House Style...`
   - Select **Reprise** from the built-in list
   - Uses 9 fonts designed to simulate hand-copied manuscript with a fixed-width nib

2. **Inkpen2** (more modern jazz handwriting):
   - Same steps, select **Jazz (Inkpen2)**
   - Includes script fonts for text and special symbols

The **Reprise** house style is the closest any notation software comes to the look in
your reference image (Mozart/Beethoven manuscript) out of the box.

## Colour reference

| Element | Hex | RGB | Description |
|---------|-----|-----|-------------|
| Ink (text/frames) | `#4B3012` | `75, 48, 18` | Dark sepia brown (iron gall ink) |
| Ink (notation, via INI) | `#4B3012` | `75, 48, 18` | Same, for noteheads/clefs/etc |
| Paper | `#F5E6C8` | `245, 230, 200` | Warm parchment cream |
| Background | `#D4C4A0` | `212, 196, 160` | Darker desk/table colour |

## Limitations

No notation software can perfectly replicate actual 18th-century handwriting. This style
gets you as close as possible using the built-in Petaluma font + colour/layout tweaks.
The main remaining differences from a real manuscript:

- **Spacing regularity**: Software spaces notes evenly; manuscripts are irregular
- **Stroke variation**: Real quill strokes vary in thickness; Petaluma is more uniform
- **Staff ruling**: Real manuscripts have hand-drawn (slightly wavy) staff lines
- **Ink blots/aging**: Real manuscripts have bleed-through, foxing, and age marks

For absolute authenticity, post-process the exported PDF through an image editor to add
paper texture, ink irregularities, and aging effects.
