//=============================================================================
//  MusicTeacher - Rhythm & Syncopation Analyzer
//
//  Detects syncopation, analyzes metric displacement, and scores voice
//  independence between parts.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Detects syncopation, metric displacement, and scores voice independence.")
    menuPath: "Plugins.Music Teacher.Rhythm Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Rhythm Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Rhythm Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color syncColor: "#e91e63"
    property color indepColor: "#006064"

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

        // Syncopation detection.
        lines.push("=== Syncopation Detection ===");
        var syncs = Theory.detectSyncopation(events, 480, 4);
        if (syncs.length === 0) {
            lines.push("No syncopation detected.");
        } else {
            for (var i = 0; i < syncs.length; i++) {
                lines.push(syncs[i].description);
                if (syncs[i].index < events.length) {
                    MS.annotateAbove(api, events[syncs[i].index], "sync", syncColor);
                }
            }
        }
        lines.push("");

        // Voice independence.
        lines.push("=== Voice Independence ===");
        var voices = [];
        var maxVoices = 0;
        for (var j = 0; j < events.length; j++) {
            var p = events[j].pitches || [];
            if (p.length > maxVoices) maxVoices = p.length;
        }
        for (var v = 0; v < maxVoices; v++) {
            voices[v] = [];
            for (var k = 0; k < events.length; k++) {
                var pts = events[k].pitches || [];
                if (v < pts.length) voices[v].push(pts[v]);
            }
        }
        if (voices.length >= 2) {
            var indep = Theory.scoreVoiceIndependence(voices);
            lines.push("Independence score: " + indep.score + " / 1.00");
            lines.push("  Contrary: " + indep.details.contrary);
            lines.push("  Oblique: " + indep.details.oblique);
            lines.push("  Similar: " + indep.details.similar);
            lines.push("  Parallel: " + indep.details.parallel);
        } else {
            lines.push("Not enough voices for independence analysis.");
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
