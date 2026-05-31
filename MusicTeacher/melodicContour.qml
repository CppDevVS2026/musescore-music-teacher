//=============================================================================
//  MusicTeacher - Melodic Contour Analyzer
//
//  Analyzes the melodic contour of the top voice: range, tessitura, climax
//  point, leap/step percentages, and contour classification.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Analyzes melodic contour: range, tessitura, climax, leaps vs steps.")
    menuPath: "Plugins.Music Teacher.Melodic Contour"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 580

    //4.4 title: "Melodic Contour"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Melodic Contour";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color contourColor: "#1a237e"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    onRun: {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        // Extract the top voice pitch from each event.
        var topPitches = [];
        for (var i = 0; i < events.length; i++) {
            var p = events[i].pitches || [];
            if (p.length > 0) {
                topPitches.push(p[p.length - 1]); // Highest pitch.
            }
        }

        var contour = Theory.analyzeMelodicContour(topPitches);
        if (!contour) { reportText = "Not enough melodic data."; return; }

        var lines = [];
        lines.push("=== Melodic Contour Analysis ===");
        lines.push("");
        lines.push("Range: " + contour.range + " semitones (" +
                    Theory.pcToName(contour.low % 12, false) + " – " +
                    Theory.pcToName(contour.high % 12, false) + ")");
        lines.push("Tessitura: " +
                    Theory.pcToName(contour.tessitura.low % 12, false) + " – " +
                    Theory.pcToName(contour.tessitura.high % 12, false));
        lines.push("Climax at event index: " + contour.climaxIndex);
        lines.push("Contour type: " + contour.contour);
        lines.push("");
        lines.push("Motion breakdown:");
        lines.push("  Steps: " + contour.stepPercent + "%");
        lines.push("  Leaps: " + contour.leapPercent + "%");
        lines.push("  Repeats: " + (100 - contour.stepPercent - contour.leapPercent) + "%");

        // Annotate climax on score.
        if (contour.climaxIndex < events.length) {
            MS.annotateAbove(api, events[contour.climaxIndex], "CLIMAX", contourColor);
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
