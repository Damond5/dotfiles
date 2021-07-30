#!/bin/sh

cat $1 | pv -s $(du -sb $1 | awk '{print $1}') | unpigz | tar x
