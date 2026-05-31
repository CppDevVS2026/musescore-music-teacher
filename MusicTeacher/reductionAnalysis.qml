//=============================================================================
//  MusicTeacher - Reduction & Structural Analysis
//
//  Identifies structural vs embellishment tones, tracks aggregate completion
//  (12-tone saturation), measures voice-leading efficiency, analyzes melodic
//  interval-class content, and shows harmonic function distribution.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Structural analysis: reduction, aggregate completion, VL efficiency, IC content, function distribution.")
    menuPath: "Plugins.Music Teacher.Reduction Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 560
    height: 700

    //4.4 title: "Reduction Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Reduction Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color structColor: "#ff6f00"
    property color aggrColor: "#1b5e20"

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

        // Structural tones (top voice).
        var topPitches = [];
        for (var i = 0; i < events.length; i++) {
            var p = events[i].pitches || [];
            if (p.length > 0) topPitches.push(p[p.length - 1]);
        }

        lines.push("=== Structural Tone Analysis ===");
        var structural = Theory.identifyStructuralTones(topPitches, null, key);
        var structCount = 0;
        for (var s = 0; s < structural.length; s++) {
            if (structural[s].structural) {
                structCount++;
                if (s < events.length) {
                    MS.annotateAbove(api, events[s], "S", structColor);
                }
            }
        }
        lines.push("Structural tones: " + structCount + " / " + topPitches.length);
        lines.push("");

        // Aggregate completion (all pitch classes).
        lines.push("=== Aggregate Completion ===");
        var allPcs = [];
        for (var a = 0; a < events.length; a++) {
            var pcs = events[a].pitchClasses || [];
            for (var b = 0; b < pcs.length; b++) allPcs.push(pcs[b]);
        }
        var aggr = Theory.trackAggregateCompletion(allPcs);
        if (aggr.completionIndex >= 0) {
            lines.push("First complete aggregate at pc index: " + aggr.completionIndex);
            lines.push("Total aggregates: " + aggr.totalAggregates);
        } else {
            lines.push("Incomplete aggregate (" + aggr.pcsCovered + "/12 pitch classes).");
        }
        lines.push("");

        // Voice-leading efficiency (consecutive chords).
        lines.push("=== Voice-Leading Efficiency ===");
        var totalVL = 0, vlCount = 0, parsimoniousCount = 0;
        for (var v = 1; v < events.length; v++) {
            var prevP = events[v-1].pitches || [];
            var currP = events[v].pitches || [];
            if (prevP.length >= 2 && currP.length >= 2) {
                var vle = Theory.voiceLeadingEfficiency(prevP, currP);
                if (vle) {
                    vlCount++;
                    totalVL += vle.totalSemitones;
                    if (vle.parsimonious) parsimoniousCount++;
                }
            }
        }
        if (vlCount > 0) {
            lines.push("Average motion: " + Math.round(totalVL / vlCount * 100) / 100 + " semitones");
            lines.push("Parsimonious progressions: " + parsimoniousCount + "/" + vlCount +
                        " (" + Math.round(parsimoniousCount / vlCount * 100) + "%)");
        } else {
            lines.push("Not enough multi-voice events for VL analysis.");
        }
        lines.push("");

        // Melodic interval-class content.
        lines.push("=== Melodic Interval-Class Content ===");
        var icResult = Theory.melodicIntervalClassContent(topPitches);
        var icNames = ["unison", "m2/M7", "M2/m7", "m3/M6", "M3/m6", "P4/P5", "tritone"];
        for (var ic = 0; ic <= 6; ic++) {
            if (icResult.ic[ic] > 0) {
                lines.push("  ic" + ic + " (" + icNames[ic] + "): " + icResult.ic[ic]);
            }
        }
        lines.push("Most common: ic" + icResult.mostCommonIC + " (" + icNames[icResult.mostCommonIC] + ")");
        lines.push("");

        // Harmonic function distribution.
        lines.push("=== Harmonic Function Distribution ===");
        var dist = Theory.harmonicFunctionDistribution(events, key);
        if (dist.total > 0) {
            lines.push("Tonic: " + dist.tonic + " (" + dist.tonicPercent + "%)");
            lines.push("Subdominant/PD: " + dist.subdominant + " (" + dist.subdominantPercent + "%)");
            lines.push("Dominant: " + dist.dominant + " (" + dist.dominantPercent + "%)");
            lines.push("Chromatic: " + dist.chromatic + " (" + dist.chromaticPercent + "%)");
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
