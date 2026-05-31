//=============================================================================
//  MusicTeacher - Counterpoint & SATB Checker
//
//  Checks first-species counterpoint rules, SATB voice ranges, voice crossing,
//  spacing, and cross-relations between adjacent chords.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Checks counterpoint rules, SATB ranges, voice crossing, spacing, and cross-relations.")
    menuPath: "Plugins.Music Teacher.Counterpoint Checker"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Counterpoint Checker"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Counterpoint Checker";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color cpColor: "#880e4f"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    onRun: {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var lines = [];
        var rangeIssueCount = 0;
        var crossRelCount = 0;
        var cpIssueCount = 0;

        // SATB range checking (where we have 4 voices).
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var pitches = ev.pitches || [];
            if (pitches.length === 4) {
                var sorted = pitches.slice().sort(function(a,b){ return a - b; });
                var issues = Theory.checkSATBRanges(sorted);
                for (var r = 0; r < issues.length; r++) {
                    rangeIssueCount++;
                    lines.push("m" + (ev.measure || "?") + ": " + issues[r].description);
                    MS.annotateAbove(api, ev, issues[r].voice + " " + issues[r].problem, cpColor);
                }
            }
        }

        // Cross-relation detection.
        for (var j = 1; j < events.length; j++) {
            var prevPcs = events[j-1].pitchClasses || [];
            var currPcs = events[j].pitchClasses || [];
            var crs = Theory.detectCrossRelations(prevPcs, currPcs);
            for (var c = 0; c < crs.length; c++) {
                crossRelCount++;
                lines.push("m" + (events[j].measure || "?") + ": " + crs[c].description);
                MS.annotateAbove(api, events[j], "CR: " + crs[c].name1 + "→" + crs[c].name2, "#d50000");
            }
        }

        // Counterpoint: check outer voices (lowest vs highest).
        var soprano = [], bass = [];
        for (var k = 0; k < events.length; k++) {
            var p = events[k].pitches || [];
            if (p.length >= 2) {
                var s = p.slice().sort(function(a,b){ return a - b; });
                bass.push(s[0]);
                soprano.push(s[s.length - 1]);
            }
        }
        if (soprano.length >= 2) {
            var cpIssues = Theory.checkCounterpoint(soprano, bass);
            for (var m = 0; m < cpIssues.length; m++) {
                cpIssueCount++;
                lines.push("Beat " + (cpIssues[m].index + 1) + ": " + cpIssues[m].description);
            }
        }

        lines.unshift("=== Counterpoint & SATB Report ===");
        lines.unshift("Range issues: " + rangeIssueCount +
                       "  |  Cross-relations: " + crossRelCount +
                       "  |  Counterpoint issues: " + cpIssueCount);
        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
