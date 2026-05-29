//=============================================================================
//  MusicTeacher - Harmony Analysis (Teacher)
//
//  Analyses the open score and annotates it for teaching: Roman numerals under
//  every chord plus colour-coded callouts for chromatic mediants, secondary
//  dominants, borrowed / modal-mixture chords, Neapolitan & augmented-sixth
//  sonorities, and cadences. A summary report is shown in a panel.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Roman-numeral analysis with callouts for chromatic mediants, secondary dominants, mixture, and cadences.")
    menuPath: "Plugins.Music Teacher.Harmony Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 520
    height: 600

    //4.4 title: "Harmony Analysis (Teacher)"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Harmony Analysis (Teacher)";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function kindHeading(kind) {
        switch (kind) {
            case "mediant": return "Chromatic mediant";
            case "secondary": return "Secondary dominant";
            case "borrowed": return "Mixture / chromatic";
            case "cadence": return "Cadence";
            default: return kind;
        }
    }

    function buildReport(result, events) {
        var lines = [];
        lines.push("KEY: " + Theory.keyName(result.key) +
                   "  (confidence " + Math.round(result.key.confidence * 100) + "%)");
        lines.push("Chords analysed: " + events.length);
        lines.push("");

        lines.push("ROMAN NUMERALS");
        for (var i = 0; i < result.items.length; i++) {
            var it = result.items[i];
            if (it.kind === "roman")
                lines.push("  m" + it.measure + ":  " + it.text);
        }

        var highlights = [];
        for (var j = 0; j < result.items.length; j++) {
            var h = result.items[j];
            if (h.kind !== "roman")
                highlights.push("  m" + h.measure + " [" + kindHeading(h.kind) + "]  " + h.text);
        }
        lines.push("");
        lines.push("HIGHLIGHTS (" + highlights.length + ")");
        if (highlights.length === 0) lines.push("  (none found)");
        else lines = lines.concat(highlights);

        return lines.join("\n");
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found to analyse."; return; }

        var hint = MS.keySignatureHint(curScore);
        var result = Theory.analyzeProgression(events, hint);
        var byTick = MS.indexByTick(events);

        curScore.startCmd();
        for (var i = 0; i < result.items.length; i++) {
            var it = result.items[i];
            var below = (it.kind === "roman");
            MS.addText(teacherApi(), it.anchorTick, it.text, it.color, below);
            if (it.kind !== "roman") MS.colorEventNotes(byTick[it.anchorTick], it.color);
        }
        curScore.endCmd();

        reportText = buildReport(result, events);
    }

    onRun: analyze()

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"

        Column {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 8

            Text {
                text: "Harmony Analysis"
                font.pointSize: 15
                font.bold: true
            }
            Text {
                width: parent.width
                wrapMode: Text.WordWrap
                color: "#555555"
                text: "Roman numerals were added below the staff; coloured callouts mark teaching points. The notes of each flagged chord are coloured to match."
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
                Button {
                    text: "Re-analyse"
                    onClicked: plugin.analyze()
                }
                Button {
                    text: "Close"
                    onClicked: plugin.quitPlugin()
                }
            }
        }
    }
}
