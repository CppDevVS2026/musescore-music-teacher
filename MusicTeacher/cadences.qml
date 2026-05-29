//=============================================================================
//  MusicTeacher - Cadence Finder
//
//  Detects cadences across the score (perfect/imperfect authentic, half,
//  deceptive, plagal) and labels each one above the staff.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Finds and labels cadences (PAC, IAC, HC, deceptive, plagal).")
    menuPath: "Plugins.Music Teacher.Cadence Finder"
    pluginType: "dialog"
    requiresScore: true
    width: 480
    height: 520

    //4.4 title: "Cadence Finder"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Cadence Finder";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color cadenceColor: "#2e7d32"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found."; return; }

        // Key from the whole-piece histogram (seeded by the key signature).
        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var h = 0; h < events.length; h++) {
            var pcs = events[h].pitchClasses;
            for (var p = 0; p < pcs.length; p++) hist[pcs[p] % 12] += events[h].durationTicks;
            events[h].chord = Theory.identifyChord(events[h].pitchClasses, events[h].bassPc);
        }
        var key = Theory.detectKey(hist, MS.keySignatureHint(curScore));

        var lines = ["CADENCES in " + Theory.keyName(key), ""];
        var found = 0;

        curScore.startCmd();
        var prev = null;
        for (var k = 0; k < events.length; k++) {
            var e = events[k];
            if (!e.chord) { prev = null; continue; }
            if (prev && prev.chord) {
                var c = Theory.classifyCadence(prev.chord, e.chord, prev.sopranoPc, e.sopranoPc, key);
                if (c) {
                    found++;
                    MS.addText(teacherApi(), e.tick, c.type, "" + plugin.cadenceColor, false);
                    lines.push("  m" + e.measure + ":  " + c.type + " - " + c.description);
                }
            }
            prev = e;
        }
        curScore.endCmd();

        if (found === 0) lines.push("  No cadences detected.");
        lines.splice(1, 0, "Found: " + found);
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
            Text { text: "Cadence Finder"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Cadence labels are added in green above the staff at the resolving chord."
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
