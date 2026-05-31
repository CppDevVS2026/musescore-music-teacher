//=============================================================================
//  MusicTeacher - Twelve-Tone / Serial Analysis
//
//  Computes all row forms (P, I, R, RI) for a user-supplied tone row, and
//  searches the score for matching row segments.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import QtQuick.Layouts 1.3
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Twelve-tone serial analysis: compute row forms and find row segments in the score.")
    menuPath: "Plugins.Music Teacher.Serial Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 560
    height: 680

    //4.4 title: "Serial Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Serial Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color serialColor: "#bf360c"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function runAnalysis() {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        // Try to derive the row from the first 12 distinct pitch classes.
        var row = [];
        var seen = {};
        for (var i = 0; i < events.length && row.length < 12; i++) {
            var pcs = events[i].pitchClasses || [];
            for (var j = 0; j < pcs.length && row.length < 12; j++) {
                var pc = Theory.mod(pcs[j], 12);
                if (!seen[pc]) { seen[pc] = true; row.push(pc); }
            }
        }

        var lines = [];
        lines.push("=== Twelve-Tone Analysis ===");
        lines.push("");

        if (row.length < 12) {
            lines.push("Only " + row.length + " distinct pitch classes found.");
            lines.push("A complete 12-tone row requires all 12 pitch classes.");
            reportText = lines.join("\n");
            return;
        }

        lines.push("Derived row (P0): " + row.map(function(pc){ return Theory.pcToName(pc, false); }).join(" "));
        lines.push("");

        var forms = Theory.computeRowForms(row);
        lines.push("P0:  " + forms.P0.join(" "));
        lines.push("I0:  " + forms.I0.join(" "));
        lines.push("R0:  " + forms.R0.join(" "));
        lines.push("RI0: " + forms.RI0.join(" "));
        lines.push("");

        // Search the score for row-form matches in the melodic line.
        var melody = [];
        for (var k = 0; k < events.length; k++) {
            var p = events[k].pitchClasses || [];
            if (p.length > 0) melody.push(Theory.mod(p[p.length - 1], 12));
        }

        lines.push("=== Row Form Matches (top voice) ===");
        var matchCount = 0;
        for (var m = 0; m <= melody.length - 3; m++) {
            var segment = melody.slice(m, Math.min(m + 12, melody.length));
            var match = Theory.findRowForm(row, segment);
            if (match) {
                matchCount++;
                lines.push("Index " + m + ": " + match.label +
                           " (m" + (events[m].measure || "?") + ")");
                MS.annotateAbove(api, events[m], match.label, serialColor);
            }
        }
        if (matchCount === 0) lines.push("No row-form segments found in top voice.");

        reportText = lines.join("\n");
    }

    onRun: { runAnalysis(); }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
