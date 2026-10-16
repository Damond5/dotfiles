#!/usr/bin/env bash
# Unmount the drives mounted by ~/gdMount.sh.

for dir in ~/drive ~/shared; do
  if mountpoint -q "$dir"; then
    fusermount3 -u "$dir" && echo "Unmounted $dir"
  fi
done
