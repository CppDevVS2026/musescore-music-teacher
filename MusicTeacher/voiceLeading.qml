//=============================================================================
//  MusicTeacher - Voice-Leading Checker
//
//  Compares successive vertical sonorities and flags parallel perfect fifths
//  and octaves, colouring the offending notes red.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Flags parallel perfect fifths and octaves between voices.")
    menuPath: "Plugins.Music Teacher.Voice-Leading Checker"
    pluginType: "dialog"
    requiresScore: true
    width: 480
    height: 520

    //4.4 title: "Voice-Leading Checker"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Voice-Leading Checker";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color flagColor: "#d32f2f"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    // Sorted ascending pitches form the "voices" for parallel detection.
    function voicesOf(ev) {
        var v = ev.pitches.slice();
        v.sort(function (a, b) { return a - b; });
        return v;
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);

        var lines = ["VOICE-LEADING ISSUES", ""];
        var found = 0;

        curScore.startCmd();
        var prev = null;
        for (var k = 0; k < events.length; k++) {
            var e = events[k];
            if (e.pitches.length < 2) { prev = e; continue; }
            if (prev && prev.pitches.length >= 2) {
                var issues = Theory.checkVoiceLeading(voicesOf(prev), voicesOf(e));
                for (var i = 0; i < issues.length; i++) {
                    found++;
                    var label = (issues[i].type === "parallel-fifths") ? "\u20165ths" : "\u20168ves";
                    MS.addText(teacherApi(), e.tick, label, "" + plugin.flagColor, false);
                    MS.colorEventNotes(e, plugin.flagColor);
                    MS.colorEventNotes(prev, plugin.flagColor);
                    lines.push("  m" + e.measure + ":  " + issues[i].description);
                }
            }
            prev = e;
        }
        curScore.endCmd();

        if (found === 0) lines.push("  No parallel fifths or octaves found.");
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
            Text { text: "Voice-Leading Checker"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Successive chords are compared; parallel perfect fifths/octaves are coloured red and labelled."
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
