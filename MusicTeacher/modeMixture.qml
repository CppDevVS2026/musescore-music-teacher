//=============================================================================
//  MusicTeacher - Mode Mixture & Prolongation Analyzer
//
//  Identifies borrowed chords from the parallel minor (mode mixture catalog),
//  detects prolongation patterns (neighbor/passing embellishments), and
//  classifies chord substitutions.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Mode mixture catalog, prolongation analysis, and chord substitution classification.")
    menuPath: "Plugins.Music Teacher.Mode Mixture"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Mode Mixture"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Mode Mixture";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color mixtureColor: "#f57f17"
    property color prolongColor: "#827717"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    onRun: {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var key = Theory.detectKey(events);
        var lines = [];

        // Mode mixture detection.
        lines.push("=== Mode Mixture ===");
        var mixCount = 0;
        for (var i = 0; i < events.length; i++) {
            var chord = events[i].chord || Theory.identifyChord(events[i].pitchClasses || [], events[i].bassPc);
            if (!chord) continue;
            var mix = Theory.classifyModeMixture(chord, key);
            if (mix) {
                mixCount++;
                lines.push("m" + (events[i].measure || "?") + ": " + mix.description);
                MS.annotateAbove(api, events[i], mix.symbol, mixtureColor);
            }
        }
        if (mixCount === 0) lines.push("No mode mixture chords found.");
        lines.push("");

        // Prolongation detection.
        lines.push("=== Prolongation Patterns ===");
        var prolongCount = 0;
        for (var j = 1; j < events.length - 1; j++) {
            var prev = events[j-1].chord || Theory.identifyChord(events[j-1].pitchClasses || [], events[j-1].bassPc);
            var curr = events[j].chord || Theory.identifyChord(events[j].pitchClasses || [], events[j].bassPc);
            var next = events[j+1].chord || Theory.identifyChord(events[j+1].pitchClasses || [], events[j+1].bassPc);
            var prol = Theory.classifyProlongation(prev, curr, next, key);
            if (prol) {
                prolongCount++;
                lines.push("m" + (events[j].measure || "?") + ": " + prol.description);
                MS.annotateAbove(api, events[j], prol.type, prolongColor);
            }
        }
        if (prolongCount === 0) lines.push("No prolongation patterns detected.");

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
