# Finish and publish

Do these once the user is happy with the deck. Each one was asked for explicitly in the session this skill came from - do them without being asked, but confirm before anything outward-facing.

## PDF

1. Drive `download_file_content` with `exportMimeType: application/pdf` (the result is saved to a file; decode `.content` with `jq -r .content | base64 -d`).
2. Name it `Insights - [Dxxxx] Customer rev.N.pdf` (rev.1 for the first issue).
3. Upload to the project Drive folder: `rclone copy "<pdf>" gdrive: --drive-root-folder-id <project folder id>`.

## Application Insights item (board 5928675569)

Create it in group `group_title` if missing (column ids in `sources.md`): Responsible, Robot, Application, Platform, Component(s), Source material (deck link), Code (GitLab repo), Deal (Pipedrive), Confidential per the interview.

Attach the PDF to `file`:

1. `get_asset_upload_url` (fileName, `application/pdf`, exact byte size).
2. `curl -i -X PUT "<upload_url>" -H "Content-Type: application/pdf" --data-binary @"<pdf>"` and keep the `etag` header (with quotes).
3. `finalize_asset_upload` (uploadId, etag, boardId, itemId, columnId `file`).
4. Verify with `all_monday_api`: `items(ids:[...]) { assets { name } }` - `get_board_items_page` can lag and show the file column empty.

## Project records

- Project plan board: "📝 Document best practices for future projects (insights)" → Completed, Description = deck link + insights item link. Bring other items in line with what the interview revealed (e.g. a Blocked acceptance item gets the reason and what it waits on in its Description).
- Project Tracking item: status and `description` (short status, deck link, deal link). There is no "installing" status - ask the user which label fits when unsure.
- If the project plan board lacks a place for the deal link and its description is not editable, put the link in the first item's Description column and tell the user.
- The installation repo README: replace GitLab's template text with contents, links and status if still default. Do not commit.

## Version name

There is no API for named versions. Tell the user: File → Version history → Name current version → `rev.N`.

## Announcement email

Create a Gmail **draft** (never send) to `all@nordbo-robotics.com`:

- Subject: `New insights: [Dxxxx] Customer (<Platform> <application>)`
- Body: one line that the insights are available with the deck link and the insights item link; two sentences on what the installation is; three key learnings; follow-up projects if any; the user's signature (`Kind Regards / Med Venlig Hilsen,` / name / title).
- Remind the user to check the project folder's sharing reaches all@ before sending.

## Cleanup

Ask before deleting the temp My Drive folder and local downloads (see `media.md`). Leave rclone configured.
