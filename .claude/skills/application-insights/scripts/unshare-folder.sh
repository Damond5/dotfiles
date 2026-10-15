#!/usr/bin/env bash
# Remove "anyone with the link" sharing from every file in a My Drive folder,
# using the rclone gdrive: token against the Drive API.
# Usage: unshare-folder.sh "<My Drive folder>"
set -euo pipefail

folder=$1
rclone about gdrive: >/dev/null # refreshes the token if expired
token=$(rclone config dump | jq -r '.gdrive.token' | jq -r .access_token)
api=https://www.googleapis.com/drive/v3/files

for id in $(rclone lsjson "gdrive:$folder" | jq -r '.[].ID'); do
  for perm in $(curl -s -H "Authorization: Bearer $token" "$api/$id/permissions?fields=permissions(id,type)" |
    jq -r '.permissions[] | select(.type=="anyone") | .id'); do
    curl -s -o /dev/null -w "$id unshared %{http_code}\n" -X DELETE -H "Authorization: Bearer $token" "$api/$id/permissions/$perm"
  done
done
