#!/usr/bin/env bash

xrandr --output DP-0 --off

xrandr --output USB-C-0 --mode 1920x1080 --rate 60

hdmi_sink="$(pactl list sinks short | grep hdmi | awk '{print $1;}')"
pactl set-default-sink $hdmi_sink
pactl set-sink-volume $hdmi_sink 0.5

xset s off
xset -dpms
