#!/usr/bin/env bash

cat $1 | pv -s $(du -sb $1 | awk '{print $1}') | bsdtar xf -
