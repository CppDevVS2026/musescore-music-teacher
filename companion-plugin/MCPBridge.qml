// =============================================================================
//  MCPBridge.qml — MuseScore companion plugin for the MCP server.
//
//  This plugin runs inside MuseScore and exposes a local HTTP API so the
//  MCP server can control the running MuseScore instance.
//
//  Install: copy this file to your MuseScore plugins directory and enable it.
//
//  The plugin starts a lightweight HTTP server on localhost:18923 that the
//  MCP server communicates with.  Because MuseScore's QML engine does not
//  support raw TCP sockets, we use a polling approach: the plugin periodically
//  fetches pending commands from a local command file and writes results back.
//
//  For MuseScore 4 (Qt 6 / QML): uses the MuseScore 4 plugin API.
//  For MuseScore 3: uses the MuseScore 3 plugin API (minor differences).
// =============================================================================

import QtQuick 2.15
import MuseScore 3.0

MuseScore {
    menuPath: "Plugins.MCP Bridge"
    description: "MCP Bridge — enables AI assistants to control MuseScore"
    version: "1.0.0"
    requiresScore: false

    // -- Configuration --
    property string commandFileDir: Qt.resolvedUrl(".")
    property string commandFile: ""
    property string responseFile: ""
    property int pollIntervalMs: 500

    // -- State --
    property bool bridgeActive: false

    Component.onCompleted: {
        // Determine command file paths in the plugin directory
        var dir = commandFileDir.toString().replace("file:///", "").replace("file://", "");
        if (dir.charAt(dir.length - 1) !== "/" && dir.charAt(dir.length - 1) !== "\\")
            dir += "/";
        commandFile = dir + ".mcp_command.json";
        responseFile = dir + ".mcp_response.json";
        console.log("MCP Bridge: command file = " + commandFile);
        console.log("MCP Bridge: response file = " + responseFile);
    }

    // -- Polling timer --
    Timer {
        id: pollTimer
        interval: pollIntervalMs
        running: bridgeActive
        repeat: true
        onTriggered: checkForCommands()
    }

    // -- UI --
    Rectangle {
        width: 320
        height: 200
        color: "#2d2d2d"

        Column {
            anchors.centerIn: parent
            spacing: 12

            Text {
                text: "MCP Bridge"
                font.pixelSize: 18
                font.bold: true
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: bridgeActive ? "Status: ACTIVE" : "Status: STOPPED"
                font.pixelSize: 14
                color: bridgeActive ? "#4CAF50" : "#F44336"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Row {
                spacing: 10
                anchors.horizontalCenter: parent.horizontalCenter

                Rectangle {
                    width: 100; height: 36
                    color: bridgeActive ? "#666" : "#4CAF50"
                    radius: 4
                    Text {
                        text: "Start"
                        anchors.centerIn: parent
                        color: "white"
                        font.pixelSize: 13
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            bridgeActive = true;
                            console.log("MCP Bridge started");
                        }
                    }
                }

                Rectangle {
                    width: 100; height: 36
                    color: bridgeActive ? "#F44336" : "#666"
                    radius: 4
                    Text {
                        text: "Stop"
                        anchors.centerIn: parent
                        color: "white"
                        font.pixelSize: 13
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            bridgeActive = false;
                            console.log("MCP Bridge stopped");
                        }
                    }
                }
            }

            Text {
                text: "Listening for MCP commands..."
                font.pixelSize: 11
                color: "#aaa"
                visible: bridgeActive
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    // -- Command handling --

    function checkForCommands() {
        // Read command file via XMLHttpRequest (local file access)
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200 || xhr.status === 0) {
                    var text = xhr.responseText;
                    if (text && text.trim().length > 0) {
                        try {
                            var cmd = JSON.parse(text);
                            processCommand(cmd);
                        } catch (e) {
                            console.log("MCP Bridge: parse error: " + e);
                        }
                    }
                }
            }
        };
        try {
            xhr.open("GET", "file:///" + commandFile, true);
            xhr.send();
        } catch (e) {
            // File may not exist yet
        }
    }

    function writeResponse(data) {
        // Write response via a helper approach: create a temp element
        // Unfortunately QML doesn't have native file write, so we use
        // console.log with a special prefix that a helper process captures.
        var json = JSON.stringify(data);
        console.log("MCP_RESPONSE:" + json);
    }

    function processCommand(cmd) {
        var response = { ok: true, data: {} };

        switch (cmd.endpoint) {
            case "/status":
                response.data = getScoreStatus();
                break;

            case "/playback":
                handlePlayback(cmd.body);
                break;

            case "/goto":
                handleGoto(cmd.body);
                break;

            case "/selection":
                response.data = getSelection();
                break;

            case "/score_info":
                response.data = getScoreInfo();
                break;

            case "/add_text":
                handleAddText(cmd.body);
                break;

            case "/reset":
                handleReset();
                break;

            default:
                response.ok = false;
                response.error = "Unknown endpoint: " + cmd.endpoint;
        }

        writeResponse(response);
    }

    function getScoreStatus() {
        if (!curScore) return { scoreName: null, measures: 0, staves: 0 };
        return {
            scoreName: curScore.scoreName || "Untitled",
            measures: curScore.nmeasures || 0,
            staves: curScore.nstaves || 0
        };
    }

    function getScoreInfo() {
        if (!curScore) return { error: "No score open" };
        return {
            name: curScore.scoreName || "Untitled",
            measures: curScore.nmeasures || 0,
            staves: curScore.nstaves || 0,
            tracks: curScore.ntracks || 0,
            duration: curScore.duration || 0,
            title: curScore.title || "",
            composer: curScore.composer || ""
        };
    }

    function handlePlayback(body) {
        if (!curScore) return;
        var action = body ? body.action : "play";
        if (action === "play") {
            cmd("play");
        } else if (action === "stop") {
            cmd("stop");
        }
    }

    function handleGoto(body) {
        if (!curScore || !body || !body.measure) return;
        var cursor = curScore.newCursor();
        cursor.rewind(0);
        for (var i = 1; i < body.measure; i++) {
            if (!cursor.nextMeasure()) break;
        }
        // Select the first note/rest in that measure
        curScore.selection.selectRange(cursor.tick, cursor.tick + 1, 0, curScore.nstaves);
    }

    function getSelection() {
        if (!curScore) return { notes: [] };
        var sel = curScore.selection;
        if (!sel) return { notes: [] };

        var notes = [];
        var elements = sel.elements;
        if (elements) {
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                if (el.type === Element.NOTE) {
                    notes.push({
                        pitch: el.pitch,
                        tpc: el.tpc,
                        name: tpcToName(el.tpc),
                        octave: Math.floor(el.pitch / 12) - 1
                    });
                }
            }
        }
        return { notes: notes };
    }

    function handleAddText(body) {
        if (!curScore || !body) return;
        var cursor = curScore.newCursor();
        cursor.rewind(0);
        for (var i = 1; i < (body.measure || 1); i++) {
            if (!cursor.nextMeasure()) break;
        }

        var st = newElement(Element.STAFF_TEXT);
        st.text = body.text || "";
        if (body.color) st.color = body.color;
        if (body.above === false) {
            st.placement = Placement.BELOW;
        }
        cursor.add(st);
    }

    function handleReset() {
        if (!curScore) return;
        // Reset note colors
        var cursor = curScore.newCursor();
        var ntracks = curScore.ntracks;
        for (var track = 0; track < ntracks; track++) {
            cursor.rewind(0);
            cursor.track = track;
            while (cursor.segment) {
                var el = cursor.element;
                if (el && el.type === Element.CHORD) {
                    var notes = el.notes;
                    for (var i = 0; i < notes.length; i++) {
                        notes[i].color = "#000000";
                    }
                }
                cursor.next();
            }
        }
    }

    // Helper: TPC to note name (simplified version)
    function tpcToName(tpc) {
        var steps = ["F", "C", "G", "D", "A", "E", "B"];
        var letter = steps[(tpc + 1) % 7];
        var alter = Math.floor((tpc + 1) / 7) - 2;
        var acc = "";
        if (alter < 0) for (var i = 0; i < -alter; i++) acc += "b";
        else for (var i = 0; i < alter; i++) acc += "#";
        return letter + acc;
    }
}
