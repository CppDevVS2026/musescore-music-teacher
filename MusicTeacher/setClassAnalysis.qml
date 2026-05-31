//=============================================================================
//  MusicTeacher - Pitch-Class Set Analysis (Post-Tonal)
//
//  Computes normal form, prime form, interval vector, and Forte set-class
//  name for each vertical sonority. Useful for 20th-/21st-century analysis.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Computes pitch-class sets, prime forms, interval vectors, and Forte names.")
    menuPath: "Plugins.Music Teacher.Set-Class Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 560
    height: 620

    //4.4 title: "Set-Class Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Set-Class Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color setColor: "#283593"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function analyze() {
        if (!curScore) { reportText = "No score is open."; return; }
        var events = MS.collectEvents(curScore, Element);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var lines = ["PITCH-CLASS SET ANALYSIS", ""];
        var setDistrib = {};

        curScore.startCmd();
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var pcs = ev.pitchClasses || [];
            if (pcs.length < 2) continue;

            var nf = Theory.normalForm(pcs);
            var pf = Theory.primeForm(pcs);
            var iv = Theory.intervalVector(pcs);
            var fn = Theory.forteName(pcs);

            var pfStr = Theory.formatPcSet(pf);
            var ivStr = "<" + iv.join(",") + ">";

            // Annotate: Forte name on score.
            MS.addText(teacherApi(), ev.tick, fn, "" + setColor, false, 0.85);

            lines.push("m" + (ev.measure || "?") + "  NF=" + Theory.formatPcSet(nf) +
                        "  PF=" + pfStr + "  IV=" + ivStr + "  " + fn);

            setDistrib[fn] = (setDistrib[fn] || 0) + 1;
        }
        curScore.endCmd();

        // Distribution summary.
        var distLines = ["", "SET-CLASS DISTRIBUTION"];
        var entries = [];
        for (var name in setDistrib) {
            if (setDistrib.hasOwnProperty(name)) entries.push({ name: name, count: setDistrib[name] });
        }
        entries.sort(function (a, b) { return b.count - a.count; });
        for (var e = 0; e < entries.length; e++) {
            distLines.push("  " + entries[e].name + ": " + entries[e].count + "×");
        }
        distLines.push("");

        lines = [lines[0], lines[1]].concat(distLines).concat(lines.slice(2));
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
            Text { text: "Set-Class Analysis"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Post-tonal analysis: normal form, prime form, interval vector, and Forte set-class name for each sonority."
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
