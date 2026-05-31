//=============================================================================
//  MusicTeacher - Theory Drill Generator
//
//  Generates randomized exercises for interval identification, chord
//  identification, scale identification, Roman numeral labeling, and
//  cadence recognition.
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
    description: qsTr("Theory drill generator: intervals, chords, scales, Roman numerals, cadences.")
    menuPath: "Plugins.Music Teacher.Theory Drills"
    pluginType: "dialog"
    requiresScore: false
    width: 560
    height: 700

    //4.4 title: "Theory Drills"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Theory Drills";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property bool showAnswer: false

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function newInterval() {
        showAnswer = false;
        var drill = Theory.generateIntervalDrill();
        reportText = "=== Interval Identification ===\n\n" +
                     "Listen to / play these two notes:\n" +
                     "  Note 1: " + drill.startName + " (MIDI " + drill.startPitch + ")\n" +
                     "  Note 2: " + drill.endName + " (MIDI " + drill.endPitch + ")\n" +
                     "  Direction: " + drill.direction + "\n\n" +
                     "What interval is this?\n\n" +
                     "(Click 'Show Answer' when ready)";
        plugin._answer = "Answer: " + drill.intervalName + " (" + drill.semitones + " semitones, " + drill.direction + ")";
    }

    function newChord() {
        showAnswer = false;
        var drill = Theory.generateChordDrill();
        var noteNames = [];
        for (var i = 0; i < drill.pitchClasses.length; i++) {
            noteNames.push(Theory.pcToName(drill.pitchClasses[i], false));
        }
        reportText = "=== Chord Identification ===\n\n" +
                     "Play these notes together:\n" +
                     "  Notes: " + noteNames.join(", ") + "\n\n" +
                     "What chord is this? (root + quality)\n\n" +
                     "(Click 'Show Answer' when ready)";
        plugin._answer = "Answer: " + drill.answer;
    }

    function newScale() {
        showAnswer = false;
        var drill = Theory.generateScaleDrill();
        reportText = "=== Scale Identification ===\n\n" +
                     "Play these notes in order:\n" +
                     "  Notes: " + drill.noteNames.join(", ") + "\n\n" +
                     "What scale is this?\n\n" +
                     "(Click 'Show Answer' when ready)";
        plugin._answer = "Answer: " + drill.answer;
    }

    function newRomanNumeral() {
        showAnswer = false;
        var key = { tonicPc: Math.floor(Math.random() * 12), mode: Math.random() < 0.7 ? "major" : "minor" };
        var quiz = Theory.generateRomanNumeralQuiz(key, { count: 4 });
        var lines = ["=== Roman Numeral Quiz ===", "", "Key: " + quiz.key, ""];
        for (var i = 0; i < quiz.chords.length; i++) {
            lines.push("Chord " + (i + 1) + ": " + quiz.chords[i].rootName + " " + quiz.chords[i].quality +
                        "  →  What Roman numeral?");
        }
        lines.push(""); lines.push("(Click 'Show Answer' when ready)");
        reportText = lines.join("\n");
        var ans = [];
        for (var j = 0; j < quiz.chords.length; j++) {
            ans.push("Chord " + (j + 1) + ": " + quiz.chords[j].romanNumeral);
        }
        plugin._answer = "Answers:\n" + ans.join("\n");
    }

    function newCadence() {
        showAnswer = false;
        var key = { tonicPc: Math.floor(Math.random() * 12), mode: "major" };
        var drill = Theory.generateCadenceDrill(key);
        var chordNames = [];
        for (var i = 0; i < drill.chords.length; i++) chordNames.push(drill.chords[i].rootName);
        reportText = "=== Cadence Recognition ===\n\n" +
                     "Key: " + drill.key + "\n" +
                     "Chord progression: " + chordNames.join(" → ") + "\n\n" +
                     "What type of cadence is this?\n\n" +
                     "(Click 'Show Answer' when ready)";
        plugin._answer = "Answer: " + drill.cadenceType + "\n" + drill.description;
    }

    property string _answer: ""

    function revealAnswer() {
        showAnswer = true;
        reportText = reportText + "\n\n" + _answer;
    }

    onRun: { newInterval(); }

    ColumnLayout {
        anchors.fill: parent; anchors.margins: 10; spacing: 8

        ScrollView {
            Layout.fillWidth: true; Layout.fillHeight: true
            TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 13; wrapMode: Text.WordWrap }
        }

        RowLayout {
            spacing: 6
            Button { text: "Interval"; onClicked: newInterval() }
            Button { text: "Chord"; onClicked: newChord() }
            Button { text: "Scale"; onClicked: newScale() }
            Button { text: "Roman Num."; onClicked: newRomanNumeral() }
            Button { text: "Cadence"; onClicked: newCadence() }
        }
        RowLayout {
            spacing: 6
            Button { text: "Show Answer"; onClicked: revealAnswer(); enabled: !showAnswer }
            Button { text: "Close"; onClicked: quitPlugin() }
        }
    }
}
