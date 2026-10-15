#!/usr/bin/env bash
# Upload images to a My Drive folder via rclone, make each "anyone with the link",
# and print "name id url" for Slides createImage / replaceAllShapesWithImage.
# Usage: publish-images.sh "<My Drive folder>" file.jpg [file.jpg ...]
set -euo pipefail

folder=$1
shift
for f in "$@"; do
  rclone copy "$f" "gdrive:$folder"
  rclone link "gdrive:$folder/$(basename "$f")" >/dev/null
done
rclone lsjson "gdrive:$folder" | jq -r '.[] | "\(.Name) \(.ID) https://drive.google.com/uc?export=download&id=\(.ID)"'
