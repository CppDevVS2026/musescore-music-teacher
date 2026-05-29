// =============================================================================
//  MusicTeacher - mscore.js
//  Glue between the MuseScore plugin API and the pure theory engine.
//
//  Everything that touches the MuseScore object model (Cursor, Element, Note,
//  segments, ticks ...) lives here. The functions are deliberately passed the
//  API handles they need (curScore, the Element enum, newElement, ...) so that
//  this file has no hidden global dependencies.
// =============================================================================

// Collect note onsets across every staff/voice into chord "events", merging
// notes that start on the same tick into one vertical sonority.
//
//   curScore : the active score
//   Element  : the MuseScore Element enum (for Element.CHORD)
//
// Returns an array of events sorted by tick:
//   { tick, durationTicks, pitches:[midi], pitchClasses:[0..11],
//     bassPitch, sopranoPitch, bassPc, sopranoPc, notes:[Note], measure }
function collectEvents(curScore, Element) {
    var byTick = {};
    var events = [];
    var ntracks = curScore.ntracks;
    var cursor = curScore.newCursor();

    var measureBounds = measureStartTicks(curScore);

    for (var track = 0; track < ntracks; track++) {
        cursor.rewind(0);
        cursor.track = track;
        while (cursor.segment) {
            var el = cursor.element;
            if (el && el.type === Element.CHORD) {
                var tick = cursor.tick;
                var ev = byTick[tick];
                if (!ev) {
                    ev = {
                        tick: tick, durationTicks: 0,
                        pitches: [], pitchClasses: [], notes: [],
                        bassPitch: 1e9, sopranoPitch: -1, measure: 0
                    };
                    byTick[tick] = ev;
                    events.push(ev);
                }
                var dur = 0;
                if (el.duration && typeof el.duration.ticks === "number") dur = el.duration.ticks;
                if (dur > ev.durationTicks) ev.durationTicks = dur;

                var notes = el.notes;
                for (var i = 0; i < notes.length; i++) {
                    var note = notes[i];
                    if (typeof note.pitch !== "number") continue;
                    var p = note.pitch;
                    ev.pitches.push(p);
                    ev.pitchClasses.push(p % 12);
                    ev.notes.push(note);
                    if (p < ev.bassPitch) ev.bassPitch = p;
                    if (p > ev.sopranoPitch) ev.sopranoPitch = p;
                }
            }
            cursor.next();
        }
    }

    events.sort(function (a, b) { return a.tick - b.tick; });
    for (var e = 0; e < events.length; e++) {
        var x = events[e];
        if (!x.durationTicks) x.durationTicks = 1;
        x.bassPc = (x.bassPitch < 1e9) ? (x.bassPitch % 12) : 0;
        x.sopranoPc = (x.sopranoPitch >= 0) ? (x.sopranoPitch % 12) : 0;
        x.measure = measureNumberForTick(measureBounds, x.tick);
    }
    return events;
}

// Build an ascending list of measure start ticks: [{ tick, no }].
function measureStartTicks(curScore) {
    var bounds = [];
    var cursor = curScore.newCursor();
    cursor.rewind(0);
    var no = 1;
    do {
        bounds.push({ tick: cursor.tick, no: no });
        no++;
    } while (cursor.nextMeasure());
    return bounds;
}

// 1-based measure number containing a tick.
function measureNumberForTick(bounds, tick) {
    var no = 1;
    for (var i = 0; i < bounds.length; i++) {
        if (bounds[i].tick <= tick) no = bounds[i].no; else break;
    }
    return no;
}

// Derive a key-signature hint { fifths } from the top staff at the start.
function keySignatureHint(curScore) {
    var cursor = curScore.newCursor();
    cursor.rewind(0);
    cursor.track = 0;
    if (typeof cursor.keySignature === "number") return { fifths: cursor.keySignature };
    return null;
}

// Add a STAFF_TEXT at a given tick on the top staff.
//   api : { curScore, newElement, Element, Placement }
function addText(api, tick, text, colorHex, below, fontSizeFactor) {
    var cursor = api.curScore.newCursor();
    cursor.track = 0;
    cursor.rewindToTick(tick);
    var st = api.newElement(api.Element.STAFF_TEXT);
    st.text = text;
    if (colorHex) st.color = colorHex;
    if (fontSizeFactor && st.fontSize) st.fontSize = st.fontSize * fontSizeFactor;
    cursor.add(st);
    if (below && api.Placement) st.placement = api.Placement.BELOW;
    return st;
}

// Colour every note of an event (used to highlight flagged sonorities).
function colorEventNotes(ev, colorHex) {
    if (!ev || !ev.notes) return;
    for (var i = 0; i < ev.notes.length; i++) {
        ev.notes[i].color = colorHex;
    }
}

// Reset every note in the score to the default colour.
function resetNoteColors(curScore, Element) {
    var cursor = curScore.newCursor();
    var ntracks = curScore.ntracks;
    for (var track = 0; track < ntracks; track++) {
        cursor.rewind(0);
        cursor.track = track;
        while (cursor.segment) {
            var el = cursor.element;
            if (el && el.type === Element.CHORD) {
                var notes = el.notes;
                for (var i = 0; i < notes.length; i++) notes[i].color = "#000000";
            }
            cursor.next();
        }
    }
}

// Map a tick -> event for quick lookup.
function indexByTick(events) {
    var map = {};
    for (var i = 0; i < events.length; i++) map[events[i].tick] = events[i];
    return map;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        collectEvents: collectEvents,
        measureStartTicks: measureStartTicks,
        measureNumberForTick: measureNumberForTick,
        keySignatureHint: keySignatureHint,
        addText: addText,
        colorEventNotes: colorEventNotes,
        resetNoteColors: resetNoteColors,
        indexByTick: indexByTick
    };
}
