# Media

## Constraints that shape this recipe

- The claude.ai **Slides connector** inserts images only from public URLs, and refuses **every** `createVideo` ("Permission denied") - even for public files.
- The **Drive connector** downloads only files up to ~4 MB (base64 in the response) and uploads only inline content, so it cannot move real photos or videos.
- Nordbo shared-drive files cannot be made public. The user's My Drive files can.
- So: **rclone** for all file transfer, short-lived public links on the user's My Drive for images, and the **Slides API called directly** with rclone's token for videos.

## Setup check

`rclone listremotes` must show `gdrive:` (full `drive` scope, the user's own OAuth client in a Google Cloud project with Drive API and Slides API enabled). If it is missing, stop and ask the user to set it up - `~/install.sh` prints the steps. Shared drive "Nordbo" is `gdrive,team_drive=0AM3FOeFA60q6Uk9PVA:`; any shared folder is reachable with `--drive-root-folder-id <folderId>`, single files with `rclone backend copyid gdrive: <fileId> <dir>/`.

The first direct Slides/Drive API call with the rclone token may be stopped by Claude Code's auto-mode classifier as credential use. Explain what it does and let the user approve; do not work around it.

## Download and review

```
mkdir -p /tmp/insights-<id>/{src,crop}
rclone copy gdrive: /tmp/insights-<id>/src --drive-root-folder-id <images folder id>
rclone copy gdrive: /tmp/insights-<id>/src --drive-root-folder-id <videos folder id>
```

Review with contact sheets rather than one file at a time:

- Photos: `magick <f> -auto-orient -resize 700x700` per file, then `magick montage ... -tile 4x -geometry +4+4`, and Read the sheet.
- Videos: 5 frames per video with `ffprobe` duration + `ffmpeg -ss <t> -frames:v 1 -vf scale=-2:300`, one strip per video, 5 strips per sheet. Phone videos are portrait 9:16.

Installation videos usually come as **teach/play pairs** (painter records with the tracked tool, then the robot plays it back on the same part) - pair them by timestamp for the Result slides. Also look for: a frame showing all cameras in relation to the workspace, the robot base/mounting, tool and joystick close-ups, the parts.

Pick per slide and say why. When nothing shows what a slide needs, ask the user instead of using a weak photo.

## Images

1. Crop each image to its target box aspect so nothing is stretched: `magick <src> -auto-orient -gravity center -resize <W>x<H>^ -extent <W>x<H> -quality 85 /tmp/insights-<id>/crop/<name>.jpg` (e.g. 864x1000 for 3.24 x 3.75 in boxes, 656x1000 for the Potential project boxes). Use a region crop instead when the subject is off-centre. Convert `.webp` from websites to JPEG.
2. `scripts/publish-images.sh "<My Drive folder>" /tmp/insights-<id>/crop/*.jpg` - uploads, makes each file "anyone with the link", prints `name id url`.
3. Insert: for template placeholder boxes use `replaceAllShapesWithImage` (`containsText` "Image here" / "Optional sketch here", scoped with `pageObjectIds`, `CENTER_CROP`). For new positions use `createImage` with explicit size + transform. For slides with several placeholders (Potential projects) delete the boxes and `createImage` at their geometry.
4. `scripts/unshare-folder.sh "<My Drive folder>"` - removes the public links again. Slides keeps its own copy of each image.

## Videos

Embed straight from the Nordbo originals - no copies or public links needed:

```
scripts/slides-batch.sh <presentationId> /tmp/insights-<id>/videos.json
```

`videos.json` is a normal `batchUpdate` body (`requests` + optional `writeControl`) with `createVideo` (`source: DRIVE`, `id: <Drive file id>`) and size/transform. Two portrait clips side by side on a Result slide: 2.0 x 3.556 in each (`1828800 x 3251200` EMU) at `translateX 4572000` and `6583680`, `translateY 1325880`. Delete the placeholder image box in the same batch.

## Cleanup

At the end, ask the user before deleting the temp My Drive folder (`rclone purge`, goes to Drive trash) and `/tmp/insights-<id>`. Leave the rclone remote in place.
