#!/usr/bin/env bash

xrandr --output USB-C-0 --off

xrandr --output DP-0 --mode 3440x1440 --rate 144

game_sink="$(pactl list sinks short | grep game | awk '{print $1;}')"
pactl set-default-sink $game_sink
