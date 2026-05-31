//=============================================================================
//  MusicTeacher - Form & Texture Analyzer
//
//  Detects musical form (binary, ternary, rondo, through-composed) based on
//  key regions and cadences. Also classifies texture (monophonic, homophonic,
//  polyphonic) and detects cadential 6/4 chords.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Detects musical form, texture type, and cadential 6/4 chords.")
    menuPath: "Plugins.Music Teacher.Form & Texture"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Form & Texture"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Form & Texture";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color formColor: "#311b92"
    property color cad64Color: "#2e7d32"

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    onRun: {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var lines = [];

        // Texture classification.
        var texture = Theory.classifyTexture(events);
        lines.push("=== Texture ===");
        lines.push("Predominant texture: " + texture);
        lines.push("");

        // Key detection for form analysis.
        var key = Theory.detectKey(events);
        var regions = Theory.detectModulations(events, 4);

        // Build sections from modulation regions.
        var sections = [];
        for (var i = 0; i < regions.length; i++) {
            sections.push({
                startMeasure: regions[i].startMeasure || 1,
                endMeasure: regions[i].endMeasure || 1,
                key: regions[i].key || key
            });
        }

        var form = Theory.detectForm(sections);
        lines.push("=== Form ===");
        lines.push("Detected form: " + form.form);
        lines.push(form.description);
        lines.push("Sections: " + sections.length);
        lines.push("");

        // Cadential 6/4 detection.
        var cad64count = 0;
        for (var j = 0; j < events.length - 1; j++) {
            var chord = events[j].chord || Theory.identifyChord(events[j].pitchClasses || [], events[j].bassPc);
            var next = events[j+1].chord || Theory.identifyChord(events[j+1].pitchClasses || [], events[j+1].bassPc);
            var c64 = Theory.detectCadential64(chord, next, key);
            if (c64) {
                cad64count++;
                lines.push("m" + (events[j].measure || "?") + ": " + c64.description);
                MS.annotateAbove(api, events[j], "Cad 6/4", cad64Color);
            }
        }
        if (cad64count === 0) lines.push("No cadential 6/4 chords detected.");

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
