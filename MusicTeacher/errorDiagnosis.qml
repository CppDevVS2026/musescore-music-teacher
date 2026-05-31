//=============================================================================
//  MusicTeacher - Error Diagnosis & Teaching Feedback
//
//  Diagnoses voice-leading errors, common student mistakes, and provides
//  detailed pedagogical explanations with suggested fixes.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Diagnoses errors and common mistakes with pedagogical explanations and fix suggestions.")
    menuPath: "Plugins.Music Teacher.Error Diagnosis"
    pluginType: "dialog"
    requiresScore: true
    width: 580
    height: 700

    //4.4 title: "Error Diagnosis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Error Diagnosis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color errorColor: "#b71c1c"
    property color hintColor: "#2e7d32"

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

        // Voice-leading error diagnosis.
        lines.push("=== Voice-Leading Error Diagnosis ===");
        lines.push("");
        var diag = Theory.diagnoseErrors(events, key);
        if (diag.length === 0) {
            lines.push("No voice-leading errors detected! Great work.");
        } else {
            for (var i = 0; i < diag.length; i++) {
                var d = diag[i];
                lines.push("--- m" + d.measure + ": " + d.error + " ---");
                lines.push("WHY: " + d.explanation);
                lines.push("FIX: " + d.fix);
                lines.push("");
                if (d.index < events.length) {
                    MS.annotateAbove(api, events[d.index], d.error, errorColor);
                }
            }
        }

        // Common student mistakes.
        lines.push("=== Common Mistake Check ===");
        lines.push("");
        var mistakes = Theory.detectCommonMistakes(events, key);
        if (mistakes.length === 0) {
            lines.push("No common mistakes detected.");
        } else {
            for (var m = 0; m < mistakes.length; m++) {
                var mk = mistakes[m];
                lines.push("--- m" + mk.measure + ": " + mk.error + " ---");
                lines.push("WHY: " + mk.explanation);
                lines.push("FIX: " + mk.fix);
                lines.push("");
                if (mk.index < events.length) {
                    MS.annotateAbove(api, events[mk.index], mk.type, errorColor);
                }
            }
        }

        // Scale degree hints for top voice.
        lines.push("=== Scale Degree Ear-Training Hints ===");
        lines.push("");
        for (var h = 0; h < Math.min(events.length, 12); h++) {
            var pitches = events[h].pitches || [];
            if (pitches.length > 0) {
                var topPitch = pitches[pitches.length - 1];
                var hint = Theory.getScaleDegreeHint(topPitch, key);
                if (hint) {
                    lines.push("m" + (events[h].measure || h + 1) + ": ^" + hint.degree +
                               " (" + hint.solfege + ") " + hint.name + " — " + hint.character);
                }
            }
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
