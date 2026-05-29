//=============================================================================
//  MusicTeacher - Scale & Interval Explorer
//
//  Identifies the key, the scale/mode that fits the score's pitch content, and
//  names the melodic intervals of the top voice. Read-only (no score edits).
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Identifies the key, scale/mode, pitch inventory and melodic intervals.")
    menuPath: "Plugins.Music Teacher.Scale & Interval Explorer"
    pluginType: "dialog"
    requiresScore: true
    width: 500
    height: 560

    //4.4 title: "Scale & Interval Explorer"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Scale & Interval Explorer";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        var allPcs = [];
        var topLine = [];
        for (var i = 0; i < events.length; i++) {
            var pcs = events[i].pitchClasses;
            for (var p = 0; p < pcs.length; p++) { hist[pcs[p] % 12] += events[i].durationTicks; allPcs.push(pcs[p]); }
            if (events[i].sopranoPitch >= 0) topLine.push(events[i].sopranoPitch);
        }
        var key = Theory.detectKey(hist, MS.keySignatureHint(curScore));

        var lines = [];
        lines.push("KEY: " + Theory.keyName(key) +
                   "  (confidence " + Math.round(key.confidence * 100) + "%)");
        lines.push("");

        lines.push("PITCH INVENTORY");
        var inv = [];
        for (var pc = 0; pc < 12; pc++) if (hist[pc] > 0) inv.push(Theory.pcToName(pc, key.mode === "minor"));
        lines.push("  " + inv.join("  "));
        lines.push("");

        lines.push("SCALES / MODES that fit (tonic " + Theory.pcToName(key.tonicPc, key.mode === "minor") + ")");
        var scales = Theory.identifyScale(allPcs, key.tonicPc);
        if (scales.length === 0) lines.push("  (no single scale fits - likely chromatic or modulating)");
        for (var s = 0; s < scales.length; s++)
            lines.push("  " + (scales[s].exact ? "* " : "  ") + scales[s].name + (scales[s].exact ? "  (exact fit)" : ""));
        lines.push("");

        lines.push("TOP-VOICE MELODIC INTERVALS");
        if (topLine.length < 2) lines.push("  (not enough melody notes)");
        for (var t = 1; t < topLine.length && t < 80; t++) {
            var iv = Theory.intervalBetween(topLine[t - 1], topLine[t]);
            var dir = topLine[t] > topLine[t - 1] ? "up" : (topLine[t] < topLine[t - 1] ? "down" : "rep");
            lines.push("  " + iv.name + " (" + iv.longName + ", " + dir + ")");
        }

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
            Text { text: "Scale & Interval Explorer"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Read-only. Shows the detected key, which scales/modes fit, the pitch inventory, and the melodic intervals of the top voice."
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
