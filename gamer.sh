#!/usr/bin/env bash

xrandr --output USB-C-0 --off

xrandr --output DP-0 --mode 3440x1440 --rate 144
pactl set-default-sink 57
