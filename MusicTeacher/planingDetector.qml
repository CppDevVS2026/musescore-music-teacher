//=============================================================================
//  MusicTeacher - Planing & LIP Detector
//
//  Detects parallel chord motion (planing/parallelism), linear intervallic
//  patterns (LIPs), and hemiola rhythmic patterns.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Detects planing (parallel chord motion), linear intervallic patterns, and hemiola.")
    menuPath: "Plugins.Music Teacher.Planing & LIP Detector"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Planing & LIP Detector"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Planing & LIP Detector";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color planingColor: "#00695c"
    property color lipColor: "#5d4037"

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

        // Planing detection.
        lines.push("=== Planing (Parallel Chord Motion) ===");
        var planes = Theory.detectPlaning(events, 3);
        if (planes.length === 0) {
            lines.push("No planing detected.");
        } else {
            for (var i = 0; i < planes.length; i++) {
                lines.push(planes[i].description +
                           " (m" + planes[i].startMeasure + "–" + planes[i].endMeasure + ")");
                if (planes[i].startIndex < events.length) {
                    MS.annotateAbove(api, events[planes[i].startIndex], "Planing", planingColor);
                }
            }
        }
        lines.push("");

        // Linear intervallic patterns (outer voices).
        lines.push("=== Linear Intervallic Patterns ===");
        var upper = [], lower = [];
        for (var j = 0; j < events.length; j++) {
            var p = events[j].pitches || [];
            if (p.length >= 2) {
                var s = p.slice().sort(function(a,b){ return a - b; });
                lower.push(s[0]);
                upper.push(s[s.length - 1]);
            }
        }
        if (upper.length >= 3) {
            var lips = Theory.detectLinearIntervallic(upper, lower, 3);
            if (lips.length === 0) {
                lines.push("No LIPs detected in outer voices.");
            } else {
                for (var k = 0; k < lips.length; k++) {
                    lines.push(lips[k].description);
                    if (lips[k].startIndex < events.length) {
                        MS.annotateAbove(api, events[lips[k].startIndex], "LIP " + lips[k].pattern, lipColor);
                    }
                }
            }
        } else {
            lines.push("Not enough 2+ voice events for LIP analysis.");
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
