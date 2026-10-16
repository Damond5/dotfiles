#!/usr/bin/env bash
# Mount my Google Drive at ~/drive and the "Nordbo" shared drive at ~/shared.
# Unmount: ~/ugdMount.sh
set -euo pipefail

mount_drive() {
  local remote=$1 dir=$2
  mkdir -p "$dir"
  if mountpoint -q "$dir"; then
    echo "$dir is already mounted"
  else
    rclone mount "$remote" "$dir" --daemon --vfs-cache-mode writes
    echo "Mounted $dir"
  fi
}

mount_drive "gdrive:" ~/drive
mount_drive "gdrive,team_drive=0AM3FOeFA60q6Uk9PVA:" ~/shared
