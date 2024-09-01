#!/usr/bin/env bash

xrandr --output DP-0 --off

xrandr --output USB-C-0 --mode 1920x1080 --rate 60
pactl set-default-sink 265
