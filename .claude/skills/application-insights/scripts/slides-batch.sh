#!/usr/bin/env bash
# Send a Slides API batchUpdate with the rclone gdrive: token. Used for createVideo,
# which the claude.ai Slides connector refuses. Needs the Google Slides API enabled
# in the rclone OAuth client's Cloud project.
# Usage: slides-batch.sh <presentationId> <body.json>
set -euo pipefail

presentation=$1
body=$2
rclone about gdrive: >/dev/null # refreshes the token if expired
token=$(rclone config dump | jq -r '.gdrive.token' | jq -r .access_token)

curl -s -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
  "https://slides.googleapis.com/v1/presentations/$presentation:batchUpdate" -d @"$body" |
  jq -c '.error // [.replies[]? | keys[0]]'
