//=============================================================================
//  MusicTeacher - Harmonic Rhythm Analyzer
//
//  Shows how quickly chords change per measure, detects pedal points, and
//  identifies tritone substitutions. Combines several "horizontal" analyses.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Analyses harmonic rhythm, pedal points, and tritone substitutions.")
    menuPath: "Plugins.Music Teacher.Harmonic Rhythm"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 620

    //4.4 title: "Harmonic Rhythm"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Harmonic Rhythm";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color pedalColor: "#4e342e"
    property color tritoneColor: "#c62828"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found."; return; }

        // Key detection.
        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var h = 0; h < events.length; h++) {
            var pcs = events[h].pitchClasses || [];
            var w = events[h].durationTicks || 1;
            for (var p = 0; p < pcs.length; p++) hist[pcs[p] % 12] += w;
        }
        var key = Theory.detectKey(hist, MS.keySignatureHint(curScore));

        // Resolve chords.
        for (var c = 0; c < events.length; c++) {
            events[c].chord = Theory.identifyChord(events[c].pitchClasses || [], events[c].bassPc);
        }

        var lines = ["HARMONIC RHYTHM & TEXTURE", ""];
        lines.push("KEY: " + Theory.keyName(key));
        lines.push("");

        // Harmonic rhythm.
        var hr = Theory.analyzeHarmonicRhythm(events);
        lines.push("CHORD CHANGES PER MEASURE");
        var totalChanges = 0;
        for (var m = 0; m < hr.length; m++) {
            lines.push("  m" + hr[m].measure + ": " + hr[m].chordChanges +
                        " (" + hr[m].chords.join(" → ") + ")");
            totalChanges += hr[m].chordChanges;
        }
        var avgRate = hr.length > 0 ? (totalChanges / hr.length).toFixed(1) : "0";
        lines.push("  Average: " + avgRate + " chords/measure");
        lines.push("");

        // Pedal points.
        curScore.startCmd();
        var pedals = Theory.detectPedalPoints(events, 3);
        lines.push("PEDAL POINTS (" + pedals.length + ")");
        for (var pp = 0; pp < pedals.length; pp++) {
            var pd = pedals[pp];
            pd.type = Theory.classifyPedalType(pd.bassPc, key);
            var pedLabel = Theory.pcToName(pd.bassPc, false) + " " + pd.type + " pedal";
            lines.push("  m" + pd.startMeasure + "-m" + pd.endMeasure + ": " +
                        pedLabel + " (" + pd.length + " beats)");
            MS.addText(teacherApi(), pd.startTick, pedLabel, "" + pedalColor, true);
        }
        if (pedals.length === 0) lines.push("  (none found)");
        lines.push("");

        // Tritone substitutions.
        var tritones = 0;
        for (var t = 1; t < events.length; t++) {
            if (!events[t].chord || !events[t - 1].chord) continue;
            var sub = Theory.classifyTritoneSub(events[t - 1].chord, events[t].chord, key);
            if (sub) {
                tritones++;
                lines.push("TRITONE SUBSTITUTION at m" + events[t - 1].measure);
                lines.push("  " + sub.description);
                MS.addText(teacherApi(), events[t - 1].tick, sub.label, "" + tritoneColor, false);
                MS.colorEventNotes(events[t - 1], "" + tritoneColor);
            }
        }
        curScore.endCmd();

        if (tritones === 0) {
            lines.push("TRITONE SUBSTITUTIONS");
            lines.push("  (none found)");
        }

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
            Text { text: "Harmonic Rhythm"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Shows chord-change rates per measure, pedal points (brown), and tritone substitutions (red)."
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
