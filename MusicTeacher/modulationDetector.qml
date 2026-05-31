//=============================================================================
//  MusicTeacher - Modulation & Tonicization Detector
//
//  Detects key changes across a piece using windowed analysis, identifies
//  pivot chords, and annotates modulation points on the score.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Detects modulations, pivot chords, and tonicizations across the piece.")
    menuPath: "Plugins.Music Teacher.Modulation Detector"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 600

    //4.4 title: "Modulation Detector"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Modulation Detector";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color modulationColor: "#6a1b9a"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length < 4) { reportText = "Not enough chords for modulation analysis."; return; }

        var regions = Theory.detectModulations(events, 6);
        var lines = ["MODULATION ANALYSIS", ""];
        lines.push("Key regions found: " + regions.length);
        lines.push("");

        curScore.startCmd();
        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            var keyLabel = Theory.keyName(r.key);
            lines.push("  m" + r.startMeasure + "-m" + r.endMeasure + ": " + keyLabel +
                        " (confidence " + Math.round(r.confidence * 100) + "%)");

            // Annotate the start of each new region (after the first).
            if (i > 0) {
                MS.addText(teacherApi(), r.startTick,
                           "→ " + keyLabel, "" + modulationColor, false);

                // Try to find a pivot chord at the boundary.
                var prevRegion = regions[i - 1];
                var boundaryIdx = -1;
                for (var e = 0; e < events.length; e++) {
                    if (events[e].tick >= r.startTick) { boundaryIdx = e; break; }
                }
                if (boundaryIdx > 0) {
                    var chord = Theory.identifyChord(events[boundaryIdx - 1].pitchClasses,
                                                     events[boundaryIdx - 1].bassPc);
                    var pivot = Theory.findPivotChord(chord, prevRegion.key, r.key);
                    if (pivot) {
                        var pivotText = "Pivot: " + pivot.romanInOld + " = " + pivot.romanInNew;
                        MS.addText(teacherApi(), events[boundaryIdx - 1].tick,
                                   pivotText, "" + modulationColor, false, 0.85);
                        lines.push("    Pivot chord: " + pivotText);
                    }
                }
            }
        }
        curScore.endCmd();

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
            Text { text: "Modulation Detector"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Detects key regions and modulation points. Pivot chords (diatonic in both keys) are labelled at boundaries."
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
