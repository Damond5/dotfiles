#!/usr/bin/env bash

xrandr --output DisplayPort-0 --off

xrandr --output HDMI-A-0 --mode 3840x2160 --rate 60 --scale 0.4x0.4
# xrandr --output HDMI-A-0 --mode 1920x1080 --rate 60

hdmi_sink="$(pactl list sinks short | grep hdmi | awk '{print $1;}')"
pactl set-default-sink $hdmi_sink
pactl set-sink-volume $hdmi_sink 0.5

xset s off
xset -dpms

setxkbmap -option caps:escape
xmodmap .Xmodmap
