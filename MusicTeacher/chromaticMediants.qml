//=============================================================================
//  MusicTeacher - Chromatic Mediant Finder
//
//  Scans the score for consecutive triads in a third-relationship and flags
//  the chromatic ones (1 common tone) and doubly-chromatic ones (0 common
//  tones), colouring both chords and labelling the move. Diatonic mediants
//  (2 common tones, e.g. I-vi) are listed but not highlighted.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Highlights chromatic and doubly-chromatic mediant progressions.")
    menuPath: "Plugins.Music Teacher.Chromatic Mediant Finder"
    pluginType: "dialog"
    requiresScore: true
    width: 480
    height: 520

    //4.4 title: "Chromatic Mediant Finder"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Chromatic Mediant Finder";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color mediantColor: "#8e24aa"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        for (var i = 0; i < events.length; i++)
            events[i].chord = Theory.identifyChord(events[i].pitchClasses, events[i].bassPc);

        var lines = ["CHROMATIC MEDIANTS", ""];
        var found = 0;

        curScore.startCmd();
        var prev = null;
        for (var k = 0; k < events.length; k++) {
            var e = events[k];
            if (!e.chord) { prev = null; continue; }
            if (prev && prev.chord) {
                var m = Theory.classifyMediant(prev.chord, e.chord);
                if (m && m.type !== "diatonic-mediant") {
                    found++;
                    MS.colorEventNotes(prev, plugin.mediantColor);
                    MS.colorEventNotes(e, plugin.mediantColor);
                    MS.addText(teacherApi(), e.tick, m.description, "" + plugin.mediantColor, false);
                    lines.push("  m" + e.measure + ":  " + m.description);
                } else if (m && m.type === "diatonic-mediant") {
                    lines.push("  m" + e.measure + ":  (diatonic) " + m.description);
                }
            }
            prev = e;
        }
        curScore.endCmd();

        if (found === 0) lines.push("  No chromatic mediants found.");
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
            Text { text: "Chromatic Mediant Finder"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Chromatic mediants share one common tone; doubly-chromatic mediants share none. Flagged chords are coloured purple."
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
