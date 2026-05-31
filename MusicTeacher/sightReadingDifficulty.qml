//=============================================================================
//  MusicTeacher - Sight-Reading Difficulty Scorer
//
//  Scores the difficulty of a passage (1-10) based on range, chromaticism,
//  leap frequency, and voice count. Generates practice tips.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Scores sight-reading difficulty (1-10) and generates practice tips.")
    menuPath: "Plugins.Music Teacher.Sight-Reading Difficulty"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Sight-Reading Difficulty"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Sight-Reading Difficulty";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""

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

        // Difficulty score.
        var diff = Theory.scoreSightReadingDifficulty(events, key);
        lines.push("=== Sight-Reading Difficulty ===");
        lines.push("");
        lines.push("Overall Score: " + diff.score + " / 10");
        lines.push("");
        lines.push("Factors:");
        if (diff.factors.range) lines.push("  Range: " + diff.factors.range + "/3");
        if (diff.factors.chromaticism) lines.push("  Chromaticism: " + diff.factors.chromaticism + "/3");
        if (diff.factors.leaps) lines.push("  Leaps: " + diff.factors.leaps + "/3");
        if (diff.factors.voices) lines.push("  Voice count: " + diff.factors.voices + "/2");
        lines.push("");

        // Practice tips.
        var tips = Theory.generatePracticeTips(events, key);
        lines.push("=== Practice Tips ===");
        for (var i = 0; i < tips.length; i++) {
            lines.push("[" + tips[i].priority.toUpperCase() + "] " + tips[i].category + ": " + tips[i].tip);
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
