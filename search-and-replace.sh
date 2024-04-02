#!/usr/bin/env sh

grep -rl $1 . --exclude-dir=.git | xargs sed -i "s/$1/$2/g"
