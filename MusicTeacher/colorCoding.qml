//=============================================================================
//  MusicTeacher - Color Coding  (focus / ADHD aid)
//
//  Colours noteheads to reduce reading load: either a fixed colour per pitch
//  class (so the same letter is always the same colour) or by scale degree in
//  the detected key (tonic/dominant stand out). Includes a one-click reset.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Colour-codes noteheads by pitch class or scale degree to ease reading.")
    menuPath: "Plugins.Music Teacher.Color Coding"
    pluginType: "dialog"
    requiresScore: true
    width: 420
    height: 340

    //4.4 title: "Color Coding"
    //4.4 categoryCode: "color-notes"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Color Coding";
            plugin.categoryCode = "color-notes";
        }
    }

    property string statusText: ""
    // 12-colour pitch-class palette (C .. B).
    property var pcColors: [
        "#e53935", "#d81b60", "#8e24aa", "#5e35b1", "#3949ab", "#1e88e5",
        "#039be5", "#00897b", "#43a047", "#7cb342", "#fdd835", "#fb8c00"
    ]
    // Scale-degree palette: 1..7 (index 0 unused), chromatic handled separately.
    property var degColors: ["#9e9e9e", "#e53935", "#fb8c00", "#43a047", "#1e88e5",
                             "#8e24aa", "#00897b", "#6d4c41"]

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function forEachNote(fn) {
        var cursor = curScore.newCursor();
        var ntracks = curScore.ntracks;
        for (var track = 0; track < ntracks; track++) {
            cursor.rewind(0);
            cursor.track = track;
            while (cursor.segment) {
                var el = cursor.element;
                if (el && el.type === Element.CHORD) {
                    var notes = el.notes;
                    for (var i = 0; i < notes.length; i++) fn(notes[i]);
                }
                cursor.next();
            }
        }
    }

    function applyByPitchClass() {
        if (!curScore) { statusText = "No score is open."; return; }
        curScore.startCmd();
        forEachNote(function (note) {
            if (typeof note.pitch === "number") note.color = plugin.pcColors[note.pitch % 12];
        });
        curScore.endCmd();
        statusText = "Coloured every note by pitch class.";
    }

    function applyByScaleDegree() {
        if (!curScore) { statusText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        var hist = [0,0,0,0,0,0,0,0,0,0,0,0];
        for (var i = 0; i < events.length; i++) {
            var pcs = events[i].pitchClasses;
            for (var p = 0; p < pcs.length; p++) hist[pcs[p] % 12] += events[i].durationTicks;
        }
        var key = Theory.detectKey(hist, MS.keySignatureHint(curScore));
        curScore.startCmd();
        forEachNote(function (note) {
            if (typeof note.pitch !== "number") return;
            var pc = note.pitch % 12;
            var deg = Theory.scaleDegree(pc, key);
            note.color = Theory.isDiatonic(pc, key) ? plugin.degColors[deg] : "#9e9e9e";
        });
        curScore.endCmd();
        statusText = "Coloured by scale degree in " + Theory.keyName(key) + ". Chromatic notes are grey.";
    }

    function resetColors() {
        if (!curScore) { statusText = "No score is open."; return; }
        curScore.startCmd();
        MS.resetNoteColors(curScore, Element);
        curScore.endCmd();
        statusText = "Reset all note colours to black.";
    }

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"
        Column {
            anchors.fill: parent
            anchors.margins: 14
            spacing: 12
            Text { text: "Color Coding"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Consistent colours make notes easier to track. Colour by pitch class (same letter = same colour) or by scale degree in the detected key."
            }
            Row {
                spacing: 8
                Button { text: "By pitch class"; onClicked: plugin.applyByPitchClass() }
                Button { text: "By scale degree"; onClicked: plugin.applyByScaleDegree() }
            }
            Row {
                spacing: 8
                Button { text: "Reset colours"; onClicked: plugin.resetColors() }
                Button { text: "Close"; onClicked: plugin.quitPlugin() }
            }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#2e7d32"
                text: plugin.statusText
            }
        }
    }
}
