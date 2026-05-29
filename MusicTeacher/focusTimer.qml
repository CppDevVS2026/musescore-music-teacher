//=============================================================================
//  MusicTeacher - Focus Practice Timer  (focus / ADHD aid)
//
//  A Pomodoro-style practice timer. Alternates focused practice intervals with
//  short breaks and shows a big, low-distraction countdown. Helps sustain
//  attention and build in regular breaks. Does not touch the score.
//=============================================================================

import QtQuick 2.9
import QtQuick.Controls 2.2
import MuseScore 3.0

MuseScore {
    id: plugin
    version: "1.0.0"
    description: qsTr("A Pomodoro-style practice timer with work/break intervals to support focus.")
    menuPath: "Plugins.Music Teacher.Focus Practice Timer"
    pluginType: "dialog"
    requiresScore: false
    width: 360
    height: 380

    //4.4 title: "Focus Practice Timer"
    //4.4 categoryCode: "composing-arranging-tools"
    Component.onCompleted: {
        if (mscoreMajorVersion >= 4) {
            plugin.title = "Focus Practice Timer";
            plugin.categoryCode = "composing-arranging-tools";
        }
    }

    property int workMinutes: 15
    property int breakMinutes: 5
    property int remaining: workMinutes * 60
    property bool onBreak: false
    property bool running: false
    property int completed: 0

    function quitPlugin() { (typeof(quit) === "undefined" ? Qt.quit : quit)(); }

    function fmt(sec) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function startPhase(breakPhase) {
        onBreak = breakPhase;
        remaining = (breakPhase ? breakMinutes : workMinutes) * 60;
    }

    function resetTimer() {
        running = false;
        onBreak = false;
        completed = 0;
        remaining = workMinutes * 60;
    }

    Timer {
        id: tick
        interval: 1000
        repeat: true
        running: plugin.running
        onTriggered: {
            if (plugin.remaining > 0) {
                plugin.remaining = plugin.remaining - 1;
            } else {
                if (!plugin.onBreak) {
                    plugin.completed = plugin.completed + 1;
                    plugin.startPhase(true);
                } else {
                    plugin.startPhase(false);
                }
            }
        }
    }

    Rectangle {
        anchors.fill: parent
        color: plugin.onBreak ? "#e8f5e9" : "#e3f2fd"

        Column {
            anchors.fill: parent
            anchors.margins: 16
            spacing: 12

            Text {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: plugin.onBreak ? "Break - rest your eyes" : "Focused practice"
                font.pointSize: 13
                color: "#444444"
            }
            Text {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: plugin.fmt(plugin.remaining)
                font.pointSize: 56
                font.bold: true
                color: plugin.onBreak ? "#2e7d32" : "#1565c0"
            }
            Text {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                color: "#666666"
                text: "Completed focus sessions: " + plugin.completed
            }

            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 8
                Button {
                    text: plugin.running ? "Pause" : "Start"
                    onClicked: plugin.running = !plugin.running
                }
                Button { text: "Reset"; onClicked: plugin.resetTimer() }
                Button { text: "Skip"; onClicked: plugin.startPhase(!plugin.onBreak) }
            }

            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 10
                Column {
                    Text { text: "Work min"; font.pointSize: 9; color: "#666" }
                    SpinBox { id: workSpin; from: 1; to: 90; value: plugin.workMinutes
                              onValueChanged: { plugin.workMinutes = value; if (!plugin.running && !plugin.onBreak) plugin.remaining = value * 60; } }
                }
                Column {
                    Text { text: "Break min"; font.pointSize: 9; color: "#666" }
                    SpinBox { id: breakSpin; from: 1; to: 30; value: plugin.breakMinutes
                              onValueChanged: plugin.breakMinutes = value }
                }
            }

            Button {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "Close"
                onClicked: plugin.quitPlugin()
            }
        }
    }
}
