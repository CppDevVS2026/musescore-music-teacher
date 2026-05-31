//=============================================================================
//  MusicTeacher - Motion Type & Voice-Leading Analyzer
//
//  Enhanced voice-leading analysis: classifies motion between all voice
//  pairs (parallel, similar, contrary, oblique) and also checks for
//  hidden (direct) fifths and octaves in addition to parallel ones.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Classifies motion types between voices and detects hidden fifths/octaves.")
    menuPath: "Plugins.Music Teacher.Motion Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 620

    //4.4 title: "Motion Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Motion Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color problemColor: "#c62828"
    property color goodColor: "#2e7d32"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length < 2) { reportText = "Not enough chords for motion analysis."; return; }

        var lines = ["MOTION TYPE ANALYSIS", ""];
        var motionCounts = { parallel: 0, similar: 0, contrary: 0, oblique: 0, static: 0 };
        var parallelProblems = 0, hiddenProblems = 0;

        curScore.startCmd();
        for (var i = 1; i < events.length; i++) {
            var prevPitches = events[i - 1].pitches.slice().sort(function (a, b) { return a - b; });
            var currPitches = events[i].pitches.slice().sort(function (a, b) { return a - b; });
            if (prevPitches.length < 2 || currPitches.length < 2) continue;

            // Motion types.
            var motions = Theory.analyzeMotionTypes(prevPitches, currPitches);
            for (var m = 0; m < motions.length; m++) {
                if (motionCounts[motions[m].motion] !== undefined)
                    motionCounts[motions[m].motion]++;
            }

            // Parallel 5ths/8ves.
            var parallels = Theory.checkVoiceLeading(prevPitches, currPitches);
            for (var p = 0; p < parallels.length; p++) {
                parallelProblems++;
                MS.addText(teacherApi(), events[i].tick,
                           parallels[p].type.replace("parallel-", "‖ "),
                           "" + problemColor, false, 0.85);
                MS.colorEventNotes(events[i], "" + problemColor);
                lines.push("  m" + (events[i].measure || "?") + ": " + parallels[p].description);
            }

            // Hidden 5ths/8ves.
            var hidden = Theory.checkHiddenIntervals(prevPitches, currPitches);
            for (var h = 0; h < hidden.length; h++) {
                hiddenProblems++;
                MS.addText(teacherApi(), events[i].tick,
                           hidden[h].type.replace("hidden-", "→ "),
                           "" + problemColor, false, 0.85);
                lines.push("  m" + (events[i].measure || "?") + ": " + hidden[h].description);
            }
        }
        curScore.endCmd();

        // Summary.
        var summary = [];
        summary.push("MOTION DISTRIBUTION");
        summary.push("  Parallel: " + motionCounts.parallel);
        summary.push("  Similar:  " + motionCounts.similar);
        summary.push("  Contrary: " + motionCounts.contrary);
        summary.push("  Oblique:  " + motionCounts.oblique);
        summary.push("  Static:   " + motionCounts.static);
        summary.push("");
        summary.push("VOICE-LEADING ISSUES");
        summary.push("  Parallel 5ths/8ves: " + parallelProblems);
        summary.push("  Hidden 5ths/8ves:   " + hiddenProblems);
        summary.push("");

        lines = [lines[0], lines[1]].concat(summary).concat(lines.slice(2));
        if (parallelProblems + hiddenProblems === 0) lines.push("  No issues found.");
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
            Text { text: "Motion Analysis"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Shows motion types (parallel/similar/contrary/oblique) between voice pairs and flags parallel + hidden 5ths/8ves."
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
