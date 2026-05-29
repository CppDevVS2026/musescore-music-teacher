//=============================================================================
//  MusicTeacher - Practice Chunker  (focus / ADHD aid)
//
//  Breaks the piece into small, numbered practice chunks of a chosen number of
//  measures. Each chunk start gets a coloured "Chunk N (mm. a-b)" marker so a
//  learner can practise one short, achievable section at a time instead of
//  facing the whole page at once.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Splits the score into small numbered practice chunks for focused, low-overwhelm practice.")
    menuPath: "Plugins.Music Teacher.Practice Chunker"
    pluginType: "dialog"
    requiresScore: true
    width: 420
    height: 320

    //4.4 title: "Practice Chunker"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Practice Chunker";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property string statusText: ""
    property var palette: ["#1565c0", "#2e7d32", "#ef6c00", "#8e24aa", "#c62828", "#00838f"]

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    // Build the API object mscore.js needs (enums + a bound newElement).
    function teacherApi() {
        return { curScore: curScore, Element: Element, Placement: Placement,
                 newElement: function (t) { return newElement(t); } };
    }

    function applyChunks(size) {
        if (!curScore) { statusText = "No score is open."; return; }
        if (size < 1) size = 1;
        var bounds = MS.measureStartTicks(curScore);
        var total = bounds.length;
        if (total === 0) { statusText = "No measures found."; return; }

        var chunks = 0;
        curScore.startCmd();
        for (var i = 0; i < total; i += size) {
            chunks++;
            var startNo = bounds[i].no;
            var endNo = Math.min(startNo + size - 1, bounds[total - 1].no);
            var color = plugin.palette[(chunks - 1) % plugin.palette.length];
            var label = "\u25b6 Chunk " + chunks + "  (mm. " + startNo +
                        (endNo > startNo ? "-" + endNo : "") + ")";
            MS.addText(teacherApi(), bounds[i].tick, label, "" + color, false);
        }
        curScore.endCmd();
        statusText = "Added " + chunks + " practice chunks of up to " + size + " measure(s).";
    }

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"
        Column {
            anchors.fill: parent
            anchors.margins: 14
            spacing: 12

            Text { text: "Practice Chunker"; font.pointSize: 15; font.bold: true }
            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#555555"
                text: "Practising in small chunks lowers overwhelm and builds momentum. Choose how many measures each chunk should cover, then add the markers."
            }

            Row {
                spacing: 10
                Text { text: "Measures per chunk:"; anchors.verticalCenter: parent.verticalCenter }
                SpinBox {
                    id: chunkSize
                    from: 1; to: 16; value: 2
                    anchors.verticalCenter: parent.verticalCenter
                }
            }

            Row {
                spacing: 8
                Button { text: "Add chunk markers"; onClicked: plugin.applyChunks(chunkSize.value) }
                Button { text: "Close"; onClicked: plugin.quitPlugin() }
            }

            Text {
                width: parent.width; wrapMode: Text.WordWrap; color: "#2e7d32"
                text: plugin.statusText
            }
        }
    }
}
