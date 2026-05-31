//=============================================================================
//  MusicTeacher - Tendency Tone Resolution Checker
//
//  Checks whether leading tones resolve up to the tonic and chordal 7ths
//  resolve down by step. Flags unresolved tendency tones.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Checks leading-tone and chordal-7th resolution across the piece.")
    menuPath: "Plugins.Music Teacher.Tendency Tones"
    pluginType: "dialog"
    requiresScore: true
    width: 500
    height: 560

    //4.4 title: "Tendency Tones"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Tendency Tones";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color resolvedColor: "#2e7d32"
    property color unresolvedColor: "#c62828"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length < 2) { reportText = "Not enough chords to check resolution."; return; }

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

        var lines = ["TENDENCY TONE RESOLUTION", ""];
        lines.push("KEY: " + Theory.keyName(key));
        lines.push("");

        var resolved = 0, unresolved = 0;

        curScore.startCmd();
        for (var i = 1; i < events.length; i++) {
            var issues = Theory.checkTendencyTones(events[i - 1], events[i], key);
            for (var j = 0; j < issues.length; j++) {
                var iss = issues[j];
                var color = iss.resolved ? "" + resolvedColor : "" + unresolvedColor;
                var tag = iss.resolved ? "✓" : "✗";
                MS.addText(teacherApi(), events[i - 1].tick,
                           tag + " " + iss.type, color, false, 0.85);
                lines.push("  m" + (events[i - 1].measure || "?") + ": " + iss.description);
                if (iss.resolved) resolved++; else unresolved++;
            }
        }
        curScore.endCmd();

        lines.splice(3, 0, "Resolved: " + resolved + "  |  Unresolved: " + unresolved);
        if (resolved + unresolved === 0) lines.push("  No tendency tones found.");
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
            Text { text: "Tendency Tones"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Checks leading-tone → tonic and chordal-7th → step-down resolution. Green = resolved, red = unresolved."
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
