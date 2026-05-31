//=============================================================================
//  MusicTeacher - Secondary Dominant Chains & Applied Chord Network
//
//  Traces chains of secondary dominants (V/x → x → ...) and builds an
//  applied-chord network showing which scale degrees are targeted.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "theory.js" as Theory
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Traces secondary dominant chains and builds an applied-chord network.")
    menuPath: "Plugins.Music Teacher.Secondary Chains"
    pluginType: "dialog"
    requiresScore: true
    width: 540
    height: 640

    //4.4 title: "Secondary Chains"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Secondary Chains";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property color chainColor: "#4a148c"

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

        // Secondary dominant chains.
        lines.push("=== Secondary Dominant Chains ===");
        var chains = Theory.traceSecondaryChain(events, key);
        if (chains.length === 0) {
            lines.push("No secondary dominant chains found.");
        } else {
            for (var i = 0; i < chains.length; i++) {
                var labels = [];
                for (var j = 0; j < chains[i].length; j++) {
                    labels.push(chains[i][j].label);
                    if (chains[i][j].index < events.length) {
                        MS.annotateAbove(api, events[chains[i][j].index], chains[i][j].label, chainColor);
                    }
                }
                lines.push("Chain " + (i + 1) + ": " + labels.join(" → "));
            }
        }
        lines.push("");

        // Applied chord network.
        lines.push("=== Applied Chord Network ===");
        var network = Theory.buildAppliedChordNetwork(events, key);
        var degrees = Object.keys(network);
        if (degrees.length === 0) {
            lines.push("No applied chords found.");
        } else {
            for (var d = 0; d < degrees.length; d++) {
                var entries = network[degrees[d]];
                var desc = [];
                for (var e = 0; e < entries.length; e++) desc.push(entries[e].appliedChord + " (m" + entries[e].measure + ")");
                lines.push("Target ^" + degrees[d] + ": " + desc.join(", "));
            }
        }

        reportText = lines.join("\n");
    }

    ScrollView {
        anchors.fill: parent; anchors.margins: 10
        TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 12; wrapMode: Text.WordWrap }
    }
    Button { text: "Close"; anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 10; onClicked: quitPlugin() }
}
