//=============================================================================
//  MusicTeacher - Sequential Pattern Finder
//
//  Detects harmonic sequences — repeated intervallic patterns in the chord
//  root progression (circle-of-fifths, stepwise, by-thirds).
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Finds harmonic sequences (circle-of-fifths, stepwise, thirds) in the chord progression.")
    menuPath: "Plugins.Music Teacher.Sequence Detector"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 560

    //4.4 title: "Sequence Detector"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Sequence Detector";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color seqColor: "#00838f"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length < 4) { reportText = "Not enough chords for sequence detection."; return; }

        // Build root-pc list.
        var rootPcs = [];
        var chordEvents = [];
        for (var i = 0; i < events.length; i++) {
            var chord = Theory.identifyChord(events[i].pitchClasses, events[i].bassPc);
            if (chord) {
                rootPcs.push(chord.rootPc);
                chordEvents.push(events[i]);
            }
        }

        var seqs = Theory.detectSequences(rootPcs);
        var lines = ["SEQUENCE ANALYSIS", ""];
        lines.push("Chords analysed: " + rootPcs.length);
        lines.push("Sequences found: " + seqs.length);
        lines.push("");

        curScore.startCmd();
        for (var s = 0; s < seqs.length; s++) {
            var seq = seqs[s];
            var dirStr = seq.direction === "ascending" ? "↑" : "↓";
            var label = seq.type + " sequence " + dirStr +
                        " (" + seq.repetitions + " reps, unit=" + seq.length + ")";
            lines.push("  Starting at chord #" + (seq.startIndex + 1) + ": " + label);

            // Annotate first chord of the sequence.
            if (seq.startIndex < chordEvents.length) {
                MS.addText(teacherApi(), chordEvents[seq.startIndex].tick,
                           "SEQ: " + seq.type + " " + dirStr, "" + seqColor, false);
            }
            // Mark the span with coloured notes.
            var endIdx = seq.startIndex + seq.length * (seq.repetitions + 1) - 1;
            for (var n = seq.startIndex; n <= endIdx && n < chordEvents.length; n++) {
                MS.colorEventNotes(chordEvents[n], "" + seqColor);
            }
        }
        curScore.endCmd();

        if (seqs.length === 0) lines.push("  No clear sequences found.");
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
            Text { text: "Sequence Detector"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Finds repeated harmonic patterns: circle-of-fifths, stepwise, and third-based sequences. Highlighted in teal."
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
