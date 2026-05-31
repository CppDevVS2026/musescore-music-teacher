//=============================================================================
//  MusicTeacher - Guided Analysis Walkthrough
//
//  Step-by-step guided analysis of a score: key identification, Roman
//  numerals, non-chord tones, cadences, voice leading, harmonic function.
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
    description: qsTr("Step-by-step guided analysis walkthrough for learning harmonic analysis.")
    menuPath: "Plugins.Music Teacher.Guided Analysis"
    pluginType: "dialog"
    requiresScore: true
    width: 580
    height: 700

    //4.4 title: "Guided Analysis"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Guided Analysis";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string reportText: ""
    property int currentStep: 0
    property var analysisData: null

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function showStep(stepNum) {
        if (!analysisData || stepNum < 0 || stepNum >= analysisData.steps.length) return;
        currentStep = stepNum;
        var step = analysisData.steps[stepNum];
        var lines = [];
        lines.push("=== Step " + step.step + " of " + analysisData.totalSteps + " ===");
        lines.push("");
        lines.push("📖 " + step.title);
        lines.push("");
        lines.push("INSTRUCTION:");
        lines.push(step.instruction);
        lines.push("");
        lines.push("DETAIL:");
        lines.push(step.detail);
        lines.push("");
        lines.push("Key: " + analysisData.key);
        reportText = lines.join("\n");
    }

    onRun: {
        var api = teacherApi();
        var events = MS.collectEvents(api);
        if (events.length === 0) { reportText = "No notes found."; return; }

        var key = Theory.detectKey(events);
        analysisData = Theory.generateGuidedAnalysis(events, key);
        showStep(0);
    }

    ColumnLayout {
        anchors.fill: parent; anchors.margins: 10; spacing: 8

        ScrollView {
            Layout.fillWidth: true; Layout.fillHeight: true
            TextArea { id: ta; text: reportText; readOnly: true; font.pixelSize: 13; wrapMode: Text.WordWrap }
        }

        RowLayout {
            spacing: 8
            Button {
                text: "← Previous"
                enabled: currentStep > 0
                onClicked: showStep(currentStep - 1)
            }
            Label {
                text: analysisData ? ("Step " + (currentStep + 1) + " / " + analysisData.totalSteps) : ""
                font.pixelSize: 14
            }
            Button {
                text: "Next →"
                enabled: analysisData ? (currentStep < analysisData.totalSteps - 1) : false
                onClicked: showStep(currentStep + 1)
            }
            Button { text: "Close"; onClicked: quitPlugin() }
        }
    }
}
