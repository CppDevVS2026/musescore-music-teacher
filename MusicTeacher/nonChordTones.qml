//=============================================================================
//  MusicTeacher - Non-Chord-Tone Highlighter
//
//  Looks at the top voice against the prevailing harmony and labels melodic
//  dissonances: passing tones, neighbor tones, suspensions, appoggiaturas,
//  escape tones and anticipations.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Labels passing tones, neighbors, suspensions and other non-chord tones in the top voice.")
    menuPath: "Plugins.Music Teacher.Non-Chord-Tone Highlighter"
    pluginType: "dialog"
    requiresScore: true
    width: 480
    height: 520

    //4.4 title: "Non-Chord-Tone Highlighter"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Non-Chord-Tone Highlighter";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color nctColor: "#ef6c00"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    property var abbrev: ({
        "passing": "PT", "neighbor": "NT", "suspension": "SUS",
        "appoggiatura": "APP", "escape": "ET", "anticipation": "ANT", "unprepared": "NCT"
    })

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);

        // Top-voice line and prevailing chord per onset.
        var line = [];
        for (var i = 0; i < events.length; i++) {
            if (events[i].sopranoPitch < 0) continue;
            var chord = Theory.identifyChord(events[i].pitchClasses, events[i].bassPc);
            line.push({ ev: events[i], pitch: events[i].sopranoPitch,
                        chordPcs: chord ? chord.chordPcs : events[i].pitchClasses });
        }

        var lines = ["NON-CHORD TONES (top voice)", ""];
        var found = 0;

        curScore.startCmd();
        for (var k = 0; k < line.length; k++) {
            var prevP = (k > 0) ? line[k - 1].pitch : undefined;
            var nextP = (k < line.length - 1) ? line[k + 1].pitch : undefined;
            var nct = Theory.classifyNonChordTone(prevP, line[k].pitch, nextP, line[k].chordPcs);
            if (nct && nct.type !== "unprepared") {
                found++;
                var tag = plugin.abbrev[nct.type] || "NCT";
                MS.addText(teacherApi(), line[k].ev.tick, tag, "" + plugin.nctColor, false);
                // colour just the top note
                var notes = topNoteOf(line[k].ev);
                if (notes) notes.color = plugin.nctColor;
                lines.push("  m" + line[k].ev.measure + ":  " + tag + " - " + nct.description);
            }
        }
        curScore.endCmd();

        if (found === 0) lines.push("  No clear non-chord tones found in the top voice.");
        lines.splice(1, 0, "Found: " + found);
        reportText = lines.join("\n");
    }

    function topNoteOf(ev) {
        var top = null;
        for (var i = 0; i < ev.notes.length; i++)
            if (!top || ev.notes[i].pitch > top.pitch) top = ev.notes[i];
        return top;
    }

    onRun: analyze()

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"
        Column {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 8
            Text { text: "Non-Chord-Tone Highlighter"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Labels the top voice: PT passing, NT neighbor, SUS suspension, APP appoggiatura, ET escape, ANT anticipation."
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
