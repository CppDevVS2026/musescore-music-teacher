//=============================================================================
//  MusicTeacher - Practice Checklist  (focus / ADHD aid)
//
//  Turns the score into a concrete, tickable practice plan: one short section
//  per row with a suggested practice step. Checking items off gives immediate
//  progress feedback, which helps motivation and focus. Read-only.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0
import "mscore.js" as MS

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("Generates a tickable, section-by-section practice checklist from the score.")
    menuPath: "Plugins.Music Teacher.Practice Checklist"
    pluginType: "dialog"
    requiresScore: true
    width: 460
    height: 560

    //4.4 title: "Practice Checklist"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Practice Checklist";
            plugin.categoryCode = "composing-arranging-tools";
        }
        rebuild(4);
    }

    property int totalMeasures: 0
    property int doneCount: 0

    property var steps: [
        "Play slowly, hands/parts separate",
        "Play slowly, hands/parts together",
        "Add dynamics & articulation",
        "Bring up to performance tempo"
    ]

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function recountDone() {
        var n = 0;
        for (var i = 0; i < listModel.count; i++) if (listModel.get(i).done) n++;
        doneCount = n;
    }

    function rebuild(sectionSize) {
        listModel.clear();
        doneCount = 0;
        if (!curScore) return;
        var bounds = MS.measureStartTicks(curScore);
        totalMeasures = bounds.length;
        if (totalMeasures === 0) return;
        if (sectionSize < 1) sectionSize = 1;

        var section = 0;
        for (var i = 0; i < totalMeasures; i += sectionSize) {
            section++;
            var startNo = bounds[i].no;
            var endNo = Math.min(startNo + sectionSize - 1, bounds[totalMeasures - 1].no);
            var range = (endNo > startNo) ? ("mm. " + startNo + "-" + endNo) : ("m. " + startNo);
            var step = plugin.steps[(section - 1) % plugin.steps.length];
            listModel.append({ label: "Section " + section + " (" + range + "): " + step, done: false });
        }
    }

    ListModel { id: listModel }

    Rectangle {
        anchors.fill: parent
        color: "#fafafa"
        Column {
            anchors.fill: parent
            anchors.margins: 14
            spacing: 10

            Text { text: "Practice Checklist"; font.pointSize: 15; font.bold: true }

            Row {
                spacing: 10
                Text { text: "Measures per section:"; anchors.verticalCenter: parent.verticalCenter }
                SpinBox { id: sectionSpin; from: 1; to: 16; value: 4
                          anchors.verticalCenter: parent.verticalCenter }
                Button { text: "Rebuild"; onClicked: plugin.rebuild(sectionSpin.value) }
            }

            Text {
                width: parent.width
                color: "#1565c0"
                text: "Progress: " + plugin.doneCount + " / " + listModel.count +
                      (listModel.count > 0 ? "  (" + Math.round(100 * plugin.doneCount / listModel.count) + "%)" : "")
            }

            Flickable {
                id: flick
                width: parent.width
                height: parent.height - 130
                clip: true
                contentWidth: width
                contentHeight: col.height
                ScrollBar.vertical: ScrollBar {}

                Column {
                    id: col
                    width: flick.width
                    spacing: 4
                    Repeater {
                        model: listModel
                        delegate: CheckBox {
                            width: col.width
                            text: model.label
                            checked: model.done
                            onCheckedChanged: {
                                listModel.setProperty(index, "done", checked);
                                plugin.recountDone();
                            }
                        }
                    }
                }
            }

            Button { text: "Close"; onClicked: plugin.quitPlugin() }
        }
    }
}
