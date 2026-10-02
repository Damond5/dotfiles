#!/bin/bash
# Start a separate RoboDK instance for scripting.
#
# Default: on a private virtual display (Xvfb), never on the user's desktop, with a popup
# watcher that confirms RoboDK message dialogs (maintenance/license notices, "target not
# reachable", camera errors) - any open dialog blocks every API call until clicked.
# Keys and clicks on the private display cannot reach the user's windows.
#
#   start_robodk.sh [--visible] [port] [station.rdk]    start (default port 20777)
#   start_robodk.sh --stop [port]                       stop RoboDK, watcher and display
#
# --visible: start on the user's display instead, WITHOUT the watcher (dialogs must be
#            clicked by the user).
# The private display is :<port - 20000> (20777 -> :777); use it for GUI work, e.g.
#   DISPLAY=:777 xdotool ... / DISPLAY=:777 scrot -o shot.png
# ROBODK_DIR: RoboDK install folder (default ~/RoboDK). Linux/X11; the private mode needs
# Xvfb (Arch: xorg-server-xvfb), xdotool and xprop.
VISIBLE=0
STOP=0
case "$1" in
    --visible) VISIBLE=1; shift ;;
    --stop) STOP=1; shift ;;
esac
PORT=${1:-20777}
STATION=${2:+$(realpath "$2")}
STATE="${XDG_RUNTIME_DIR:-/tmp}/robodk-$PORT.pids"     # RoboDK pid, Xvfb pid
DISP=":$((PORT - 20000))"

if [ "$STOP" = 1 ]; then
    [ -f "$STATE" ] && read -r RDK_PID XVFB_PID < "$STATE"
    # RoboDK by its port argument (not pkill -f: that matches this shell too)
    for p in $(pgrep -x RoboDK); do
        ps -p "$p" -o args= | grep -q -- "-PORT=$PORT\b" && kill "$p"
    done
    [ -n "$XVFB_PID" ] && kill "$XVFB_PID" 2>/dev/null
    rm -f "$STATE"
    echo "stopped RoboDK on port $PORT"
    exit 0
fi

XVFB_PID=
if [ "$VISIBLE" = 0 ]; then
    for tool in Xvfb xdotool xprop; do
        command -v "$tool" > /dev/null || { echo "$tool missing (or use --visible)" >&2; exit 1; }
    done
    setsid Xvfb "$DISP" -screen 0 1920x1080x24 +extension GLX -nolisten tcp > /dev/null 2>&1 &
    XVFB_PID=$!
    for _ in $(seq 1 50); do [ -S "/tmp/.X11-unix/X${DISP#:}" ] && break; sleep 0.1; done
    export DISPLAY="$DISP"
fi

cd "${ROBODK_DIR:-$HOME/RoboDK}/bin" || exit 1
export LD_LIBRARY_PATH="$PWD/lib" QT_PLUGIN_PATH="$PWD/plugins/" QT_QPA_PLATFORM_PLUGIN_PATH="$PWD/plugins"
setsid ./RoboDK -NEWINSTANCE -PORT="$PORT" -NOSPLASH ${STATION:+"$STATION"} > /dev/null 2>&1 &
PID=$!
echo "$PID $XVFB_PID" > "$STATE"

if [ "$VISIBLE" = 0 ]; then
    # Popup watcher (private display only): real dialog windows of this RoboDK
    # (_NET_WM_WINDOW_TYPE_DIALOG; menus and toolbars are skipped) get focus and Enter,
    # each window at most 3 times. Stops with RoboDK and takes the display down with it.
    (
        declare -A tries
        while kill -0 "$PID" 2>/dev/null; do
            for w in $(xdotool search --onlyvisible --pid "$PID" 2>/dev/null); do
                [ "${tries[$w]:-0}" -ge 3 ] && continue
                xprop -id "$w" _NET_WM_WINDOW_TYPE 2>/dev/null | grep -q DIALOG || continue
                tries[$w]=$(( ${tries[$w]:-0} + 1 ))
                xdotool windowfocus --sync "$w" key Return 2>/dev/null
            done
            sleep 1
        done
        [ -n "$XVFB_PID" ] && kill "$XVFB_PID" 2>/dev/null
        rm -f "$STATE"
    ) > /dev/null 2>&1 &
fi
disown -a

# Wait until the API port is open
for _ in $(seq 1 90); do
    ss -ltn | grep -q ":$PORT " && break
    sleep 1
done
if [ "$VISIBLE" = 0 ]; then
    echo "RoboDK pid $PID on port $PORT, private display $DISP (stop: $0 --stop $PORT)"
else
    echo "RoboDK pid $PID on port $PORT, on your display; click its dialogs yourself"
fi
