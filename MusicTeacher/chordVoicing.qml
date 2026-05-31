//=============================================================================
//  MusicTeacher - Chord Voicing & Spacing Analyzer
//
//  Analyses chord voicings: open vs close position, spacing between voices,
//  which notes are doubled, and common-tone diminished 7th chords.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Analyses chord voicing, spacing, doublings, and common-tone diminished 7ths.")
    menuPath: "Plugins.Music Teacher.Chord Voicing"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 600

    //4.4 title: "Chord Voicing"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Chord Voicing";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color spacingColor: "#ef6c00"
    property color dim7Color: "#ff6f00"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var h = 0; h < events.length; h++) {
            var pcs = events[h].pitchClasses || [];
            var w = events[h].durationTicks || 1;
            for (var p = 0; p < pcs.length; p++) hist[pcs[p] % 12] += w;
        }
        var key = Theory.detectKey(hist, MS.keySignatureHint(curScore));

        var lines = ["CHORD VOICING ANALYSIS", ""];
        lines.push("KEY: " + Theory.keyName(key));
        lines.push("");

        var openCount = 0, closeCount = 0, spacingErrors = 0, ct7Count = 0;

        curScore.startCmd();
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var chord = Theory.identifyChord(ev.pitchClasses || [], ev.bassPc);
            var sorted = ev.pitches.slice().sort(function (a, b) { return a - b; });
            ev.chord = chord;

            var voicing = Theory.analyzeVoicing(sorted, chord);
            if (!voicing) continue;

            if (voicing.position === "open") openCount++;
            else closeCount++;

            // Flag spacing issues.
            for (var s = 0; s < voicing.spacingIssues.length; s++) {
                spacingErrors++;
                MS.addText(teacherApi(), ev.tick, "SPACING", "" + spacingColor, false, 0.8);
                MS.colorEventNotes(ev, "" + spacingColor);
                lines.push("  m" + (ev.measure || "?") + ": " + voicing.spacingIssues[s].description);
            }

            // Common-tone diminished 7th detection.
            if (chord && chord.quality === "dim7") {
                // Check against the next chord.
                var next = (i < events.length - 1) ? events[i + 1] : null;
                var prev = (i > 0) ? events[i - 1] : null;
                var neighborChord = next ? Theory.identifyChord(next.pitchClasses || [], next.bassPc) : null;
                if (!neighborChord && prev) {
                    neighborChord = Theory.identifyChord(prev.pitchClasses || [], prev.bassPc);
                }
                var ct = Theory.classifyCommonToneDim7(chord, neighborChord, key);
                if (ct) {
                    ct7Count++;
                    MS.addText(teacherApi(), ev.tick, "CT°7", "" + dim7Color, false);
                    MS.colorEventNotes(ev, "" + dim7Color);
                    lines.push("  m" + (ev.measure || "?") + ": " + ct.description);
                }
            }
        }
        curScore.endCmd();

        // Summary.
        var summary = [];
        summary.push("POSITION DISTRIBUTION");
        summary.push("  Open position:  " + openCount);
        summary.push("  Close position: " + closeCount);
        summary.push("");
        summary.push("Spacing issues: " + spacingErrors);
        summary.push("CT°7 chords:    " + ct7Count);
        summary.push("");

        // Doublings report (aggregate).
        summary.push("DOUBLING SUMMARY (entire piece)");
        var allDoublings = {};
        for (var d = 0; d < events.length; d++) {
            var srt = events[d].pitches.slice().sort(function (a, b) { return a - b; });
            var v = Theory.analyzeVoicing(srt, events[d].chord);
            if (!v) continue;
            for (var dd = 0; dd < v.doublings.length; dd++) {
                var dbl = v.doublings[dd];
                allDoublings[dbl.name] = (allDoublings[dbl.name] || 0) + 1;
            }
        }
        var hasDbl = false;
        for (var dName in allDoublings) {
            if (allDoublings.hasOwnProperty(dName)) {
                summary.push("  " + dName + " doubled " + allDoublings[dName] + " time(s)");
                hasDbl = true;
            }
        }
        if (!hasDbl) summary.push("  (no doublings found)");

        lines = [lines[0], lines[1], lines[2], lines[3]].concat(summary).concat(["", "DETAILS"]).concat(lines.slice(4));
        reportText = lines.join("\n");
    }

    onRun: analyze()

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"
        Column {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 8
            Text { text: "Chord Voicing"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Shows open/close position, spacing issues, doublings, and common-tone diminished 7th chords."
            }
            Flickable {
                id: flick
                width: parent.width
                height: parent.height - 110
                clip: true
                contentWidth: width
                contentHeight: reportLabel.height
                ScrollBar.vertical: ScrollBar {}
                TextEdit {
                    id: reportLabel
                    width: flick.width
                    readOnly: true
                    selectByMouse: true
                    wrapMode: TextEdit.WordWrap
                    font.family: "monospace"
                    font.pointSize: 10
                    text: plugin.reportText
                }
            }
            Row {
                spacing: 8
                Button { text: "Re-analyse"; onClicked: plugin.analyze() }
                Button { text: "Close"; onClicked: plugin.quitPlugin() }
            }
        }
    }
}
