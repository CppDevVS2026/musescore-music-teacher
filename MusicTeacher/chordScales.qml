//=============================================================================
//  MusicTeacher - Chord-Scale Suggester
//
//  For each chord in the score, suggests compatible jazz scales. Also maps
//  harmonic tension across the piece and detects augmented sixth chords
//  (Italian, French, German).
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Suggests chord-scales (jazz), maps harmonic tension, and classifies augmented sixths.")
    menuPath: "Plugins.Music Teacher.Chord-Scale Suggester"
    pluginType: "dialog"
    requiresScore: true
    width: 560
    height: 680

    //4.4 title: "Chord-Scale Suggester"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Chord-Scale Suggester";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color csColor: "#0d47a1"
    property color aug6Color: "#ad1457"
    property color tensionColor: "#e65100"

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

        // Chord-scale suggestions.
        lines.push("=== Chord-Scale Suggestions ===");
        for (var i = 0; i < events.length; i++) {
            var chord = events[i].chord ||
                        Theory.identifyChord(events[i].pitchClasses || [], events[i].bassPc);
            if (!chord) continue;
            var scales = Theory.suggestChordScales(chord);
            if (scales.length > 0) {
                var scaleNames = [];
                for (var s = 0; s < scales.length; s++) scaleNames.push(scales[s].scaleName);
                var label = Theory.chordLabel(chord) + ": " + scaleNames.join(", ");
                lines.push("m" + (events[i].measure || "?") + "  " + label);
                MS.annotateAbove(api, events[i], scaleNames[0], csColor);
            }
        }

        // Augmented sixth detection.
        lines.push("");
        lines.push("=== Augmented Sixth Chords ===");
        var aug6count = 0;
        for (var j = 0; j < events.length; j++) {
            var pcs = events[j].pitchClasses || [];
            var a6 = Theory.classifyAugmentedSixth(pcs, key);
            if (a6) {
                aug6count++;
                lines.push("m" + (events[j].measure || "?") + ": " + a6.description);
                MS.annotateAbove(api, events[j], a6.type, aug6Color);
            }
        }
        if (aug6count === 0) lines.push("None found.");

        // Harmonic tension curve.
        lines.push("");
        lines.push("=== Harmonic Tension Map ===");
        var tensions = Theory.computeHarmonicTension(events, key);
        var maxTension = 0;
        for (var k = 0; k < tensions.length; k++) {
            if (tensions[k].tension > maxTension) maxTension = tensions[k].tension;
        }
        for (var m = 0; m < tensions.length; m++) {
            var bar = "";
            for (var b = 0; b < Math.round(tensions[m].tension); b++) bar += "█";
            lines.push("m" + tensions[m].measure + " " + tensions[m].chord +
                        " [" + tensions[m].tension + "] " + bar);
        }
        lines.push("Peak tension: " + maxTension);

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
